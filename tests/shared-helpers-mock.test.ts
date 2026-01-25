/**
 * Tests for src/shared/helpers.ts
 * Covers both blob.bytes() branch and arrayBuffer() fallback branch
 */
import { describe, expect, it } from 'vitest';
import { readBlobBytes } from '../src/shared/internal/mod.ts';

describe('shared/helpers.ts tests', () => {
    describe('readBlobBytes with native Blob.bytes', () => {
        it('should use blob.bytes() when available', async () => {
            const testData = new Uint8Array([1, 2, 3, 4, 5]);
            const blob = new Blob([testData]);

            // Verify native Blob.bytes is available (Playwright 145+)
            expect(typeof blob.bytes).toBe('function');

            const result = await readBlobBytes(blob);

            expect(result).toBeInstanceOf(Uint8Array);
            expect(Array.from(result)).toEqual([1, 2, 3, 4, 5]);
        });
    });

    describe('readBlobBytes with arrayBuffer fallback', () => {
        it('should fallback to arrayBuffer() when blob.bytes is not available', async () => {
            const testData = new Uint8Array([10, 20, 30, 40, 50]);
            const originalBlob = new Blob([testData]);

            // Create a blob-like object without bytes method to simulate older browsers
            const blobWithoutBytes = {
                arrayBuffer: () => originalBlob.arrayBuffer(),
                bytes: undefined,
            } as unknown as Blob;

            // Verify bytes is not available
            expect(typeof blobWithoutBytes.bytes).toBe('undefined');

            const result = await readBlobBytes(blobWithoutBytes);

            expect(result).toBeInstanceOf(Uint8Array);
            expect(Array.from(result)).toEqual([10, 20, 30, 40, 50]);
        });
    });
});
