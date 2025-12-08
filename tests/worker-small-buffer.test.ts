/**
 * Tests for worker adapter with small buffer to trigger RangeError
 * Covers: line 128 (request too large), line 184 (catch branch for RangeError)
 *
 * This test uses a very small buffer (64 bytes) to trigger the RangeError
 * when the request data exceeds the buffer's maxDataLength.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { SyncMessenger } from '../src/worker/shared.ts';
import { setSyncMessenger, writeFileSync, getSyncMessenger } from '../src/worker/opfs_worker_adapter.ts';

describe('Worker Adapter with Small Buffer', () => {
    let originalMessenger: SyncMessenger | undefined;

    beforeAll(() => {
        // Save the original messenger if it exists
        originalMessenger = getSyncMessenger();
    });

    afterAll(() => {
        // Restore the original messenger
        if (originalMessenger) {
            setSyncMessenger(originalMessenger);
        }
    });

    describe('Request too large error (line 128 & 184)', () => {
        it('should return error when request data exceeds buffer size', () => {
            // Create a very small buffer - just enough for header (16 bytes) + tiny data area
            const smallSab = new SharedArrayBuffer(64); // 16 header + 48 data max
            const smallMessenger = new SyncMessenger(smallSab);

            // Temporarily set the small messenger
            setSyncMessenger(smallMessenger);

            // Try to write a file with content larger than the buffer can hold
            // The request includes: [operation, filePath, contents, options]
            // This will be serialized to JSON which will exceed 48 bytes easily
            const largeContent = 'x'.repeat(100); // Much larger than 48 bytes when serialized

            // This should trigger the RangeError at line 128, which is caught at line 184
            const result = writeFileSync('/test-small-buffer.txt', largeContent);

            // The error should be caught and returned as Err
            expect(result.isErr()).toBe(true);
            const error = result.unwrapErr();
            expect(error.name).toBe('RangeError');
            expect(error.message).toContain('too large');

            // Restore original messenger
            if (originalMessenger) {
                setSyncMessenger(originalMessenger);
            }
        });
    });
});
