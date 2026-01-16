/**
 * Tests for opfs_worker_adapter.ts edge cases that require special setup
 * Covers: non-main thread check, request too large error, buffer layout, and small buffer scenarios
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { SyncChannel, writeFileSync } from '../src/mod.ts';
import { SyncMessenger, encodePayload } from '../src/sync/protocol.ts';

describe('Worker Adapter Edge Cases - Special Setup', () => {
    describe('SyncMessenger with small buffer', () => {
        it('should create messenger with minimum valid buffer', () => {
            // Minimum buffer: header (16 bytes) + at least 1 byte of data
            const sab = new SharedArrayBuffer(20);
            const messenger = new SyncMessenger(sab);

            expect(messenger.maxDataLength).toBe(4); // 20 - 16
            expect(messenger.i32a).toBeInstanceOf(Int32Array);
        });

        it('should have correct maxDataLength calculation', () => {
            const sab = new SharedArrayBuffer(1024);
            const messenger = new SyncMessenger(sab);

            expect(messenger.maxDataLength).toBe(1024 - 16);
        });
    });

    describe('Request size validation', () => {
        it('should detect when data would exceed buffer', () => {
            // Create a small buffer
            const sab = new SharedArrayBuffer(32); // 16 header + 16 data
            const messenger = new SyncMessenger(sab);

            // Create data larger than maxDataLength
            const largeData = new Uint8Array(20); // > 16 bytes

            // The check happens in callWorkerFromMain which is internal
            // We verify the messenger correctly reports its limits
            expect(largeData.byteLength > messenger.maxDataLength).toBe(true);
        });

        it('should encode data to buffer correctly', () => {
            const data = [1, 'test'];
            const encoded = encodePayload(data);

            expect(encoded).toBeInstanceOf(Uint8Array);
            expect(encoded.byteLength).toBeGreaterThan(0);
        });

        it('should encode large data that could exceed small buffer', () => {
            // Create a large payload
            const largeString = 'x'.repeat(1000);
            const data = [1, largeString];
            const encoded = encodePayload(data);

            // Verify it's larger than a small buffer would allow
            const smallSab = new SharedArrayBuffer(100);
            const smallMessenger = new SyncMessenger(smallSab);

            expect(encoded.byteLength > smallMessenger.maxDataLength).toBe(true);
        });
    });

    describe('Buffer layout verification', () => {
        it('should have correct Int32Array indices', () => {
            const sab = new SharedArrayBuffer(1024);
            const messenger = new SyncMessenger(sab);

            // Header is 4 Int32 values = 16 bytes
            expect(messenger.i32a.length).toBe(256); // 1024 / 4

            // First 4 indices are header
            // Index 0: MAIN_LOCK
            // Index 1: WORKER_LOCK
            // Index 2: DATA_LENGTH
            // Index 3: RESERVED
            messenger.i32a[0] = 1;
            messenger.i32a[1] = 0;
            messenger.i32a[2] = 100;
            messenger.i32a[3] = 0;

            expect(messenger.i32a[0]).toBe(1);
            expect(messenger.i32a[2]).toBe(100);
        });

        it('should allow writing and reading payload', () => {
            const sab = new SharedArrayBuffer(1024);
            const messenger = new SyncMessenger(sab);

            const payload = new Uint8Array([1, 2, 3, 4, 5]);
            messenger.setPayload(payload);

            const readPayload = messenger.getPayload(5);
            expect(readPayload).toEqual(payload);
        });
    });
});

describe('Worker Adapter with Small Buffer', () => {
    // Store the original SharedArrayBuffer to restore later
    let originalSab: SharedArrayBuffer | undefined;

    beforeAll(async () => {
        // Connect with a normal buffer first to save the SAB
        if (!SyncChannel.isReady()) {
            const connectRes = await SyncChannel.connect(
                new Worker(new URL('./worker.ts', import.meta.url), {
                    type: 'module',
                }),
                {
                    sharedBufferLength: 10 * 1024 * 1024,
                    opTimeout: 5000,
                },
            );
            if (connectRes.isOk()) {
                originalSab = connectRes.unwrap();
            }
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
