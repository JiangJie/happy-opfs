/**
 * Mock tests for src/shared/helpers.ts
 * Covers the blob.bytes() branch by mocking Blob.prototype.bytes
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { readBlobBytes } from '../src/shared/internal/mod.ts';

describe('shared/helpers.ts mock tests', () => {
    describe('readBlobBytes with mocked Blob.bytes', () => {
        const originalBytes = Blob.prototype.bytes;

        beforeAll(() => {
            // Mock Blob.prototype.bytes to simulate Chrome 144+ behavior
            // @ts-expect-error - require chrome 144+ but playwright is 143
            Blob.prototype.bytes = async function(): Promise<Uint8Array> {
                const buffer = await this.arrayBuffer();
                return new Uint8Array(buffer);
            };
        });

        afterAll(() => {
            // Restore original (undefined in Chrome 143)
            Blob.prototype.bytes = originalBytes;
        });

        it('should use blob.bytes() when available', async () => {
            const testData = new Uint8Array([1, 2, 3, 4, 5]);
            const blob = new Blob([testData]);

            // Verify mock is working
            expect(typeof blob.bytes).toBe('function');

            const result = await readBlobBytes(blob);

            expect(result).toBeInstanceOf(Uint8Array);
            expect(Array.from(result)).toEqual([1, 2, 3, 4, 5]);
        });
    });
});
