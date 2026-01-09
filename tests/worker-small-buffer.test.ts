/**
 * Tests for worker adapter with small buffer to trigger RangeError
 * Covers: request too large error in callWorkerFromMain
 *
 * This test uses a very small buffer (64 bytes) to trigger the RangeError
 * when the request data exceeds the buffer's maxDataLength.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { SyncChannel, writeFileSync } from '../src/mod.ts';

describe('Worker Adapter with Small Buffer', () => {
    // Store the original SharedArrayBuffer to restore later
    let originalSab: SharedArrayBuffer | undefined;

    beforeAll(async () => {
        // Connect with a normal buffer first to save the SAB
        if (!SyncChannel.isReady()) {
            originalSab = await SyncChannel.connect(
                new Worker(new URL('./worker.ts', import.meta.url), {
                    type: 'module',
                }),
                {
                    sharedBufferLength: 10 * 1024 * 1024,
                    opTimeout: 5000,
                },
            );
        }
    });

    afterAll(() => {
        // Restore the original SAB
        if (originalSab) {
            SyncChannel.attach(originalSab, { opTimeout: 5000 });
        }
    });

    describe('Request too large error', () => {
        it('should return error when request data exceeds buffer size', () => {
            // Create a very small buffer - just enough for header (16 bytes) + tiny data area
            const smallSab = new SharedArrayBuffer(64); // 16 header + 48 data max

            // Temporarily attach the small buffer
            SyncChannel.attach(smallSab, { opTimeout: 5000 });

            // Try to write a file with content larger than the buffer can hold
            // The request includes: [operation, filePath, contents, options]
            // This will be serialized to JSON which will exceed 48 bytes easily
            const largeContent = 'x'.repeat(100); // Much larger than 48 bytes when serialized

            // This should trigger the RangeError
            const result = writeFileSync('/test-small-buffer.txt', largeContent);

            // The error should be caught and returned as Err
            expect(result.isErr()).toBe(true);
            const error = result.unwrapErr();
            expect(error.name).toBe('RangeError');
            expect(error.message).toContain('too large');

            // Restore original SAB
            if (originalSab) {
                SyncChannel.attach(originalSab, { opTimeout: 5000 });
            }
        });
    });
});
