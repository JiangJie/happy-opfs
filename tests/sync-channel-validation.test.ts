/**
 * Tests for SyncChannel validation edge cases
 * Covers connect.ts validation branches that require isolated testing
 */
import { afterEach, describe, expect, it } from 'vitest';
import { attachSyncChannel, connectSyncChannel } from '../src/sync/channel/connect.ts';
import { setSyncChannelState } from '../src/sync/channel/state.ts';

describe('SyncChannel Validation (isolated)', () => {
    // Reset state after each test to avoid interference
    afterEach(() => {
        setSyncChannelState('idle');
    });

    describe('connectSyncChannel validation', () => {
        it('should return Err when state is connecting', async () => {
            setSyncChannelState('connecting');

            const result = await connectSyncChannel(
                new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' }),
            );
            expect(result.isErr()).toBe(true);
            expect(result.unwrapErr().message).toBe('Sync channel is connecting');
        });

        it('should return Err when worker is invalid', async () => {
            // Test with null
            // @ts-expect-error Testing invalid input
            const result1 = await connectSyncChannel(null);
            expect(result1.isErr()).toBe(true);
            expect(result1.unwrapErr()).toBeInstanceOf(TypeError);
            expect(result1.unwrapErr().message).toBe('worker must be a Worker, URL, or non-empty string');

            // Test with empty string
            const result2 = await connectSyncChannel('');
            expect(result2.isErr()).toBe(true);
            expect(result2.unwrapErr().message).toBe('worker must be a Worker, URL, or non-empty string');

            // Test with undefined
            // @ts-expect-error Testing invalid input
            const result3 = await connectSyncChannel(undefined);
            expect(result3.isErr()).toBe(true);
            expect(result3.unwrapErr().message).toBe('worker must be a Worker, URL, or non-empty string');
        });

        it('should return Err when sharedBufferLength is invalid', async () => {
            const worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });

            // Test with too small value
            const result1 = await connectSyncChannel(worker, { sharedBufferLength: 100 });
            expect(result1.isErr()).toBe(true);
            expect(result1.unwrapErr()).toBeInstanceOf(TypeError);
            expect(result1.unwrapErr().message).toBe('sharedBufferLength must be at least 256 and a multiple of 4');

            // Test with non-multiple of 4
            const result2 = await connectSyncChannel(worker, { sharedBufferLength: 257 });
            expect(result2.isErr()).toBe(true);
            expect(result2.unwrapErr().message).toBe('sharedBufferLength must be at least 256 and a multiple of 4');
        });

        it('should return Err when opTimeout is invalid', async () => {
            const worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });

            // Test with negative number
            const result1 = await connectSyncChannel(worker, { opTimeout: -1 });
            expect(result1.isErr()).toBe(true);
            expect(result1.unwrapErr()).toBeInstanceOf(TypeError);
            expect(result1.unwrapErr().message).toBe('opTimeout must be a positive integer');

            // Test with zero
            const result2 = await connectSyncChannel(worker, { opTimeout: 0 });
            expect(result2.isErr()).toBe(true);
            expect(result2.unwrapErr().message).toBe('opTimeout must be a positive integer');

            // Test with non-integer
            const result3 = await connectSyncChannel(worker, { opTimeout: 1.5 });
            expect(result3.isErr()).toBe(true);
            expect(result3.unwrapErr().message).toBe('opTimeout must be a positive integer');
        });

        it('should return Err when worker URL is invalid', async () => {
            // Use an invalid URL that will cause new Worker() to throw
            // A non-existent file:// URL or invalid protocol should trigger the error
            const result = await connectSyncChannel('invalid://not-a-valid-worker-url');
            expect(result.isErr()).toBe(true);
            // The error comes from browser's Worker constructor
        });
    });

    describe('attachSyncChannel validation', () => {
        it('should return Err when state is connecting', () => {
            // Manually set state to 'connecting' to test this branch
            setSyncChannelState('connecting');

            const sab = new SharedArrayBuffer(1024);
            const result = attachSyncChannel(sab);
            expect(result.isErr()).toBe(true);
            expect(result.unwrapErr().message).toBe('Cannot attach: sync channel is connecting');
        });

        it('should return Err when sharedBuffer is not SharedArrayBuffer', () => {
            // @ts-expect-error Testing invalid input
            const result = attachSyncChannel(new ArrayBuffer(1024));
            expect(result.isErr()).toBe(true);
            expect(result.unwrapErr()).toBeInstanceOf(TypeError);
            expect(result.unwrapErr().message).toBe('sharedBuffer must be a SharedArrayBuffer');
        });

        it('should return Err when sharedBuffer is null', () => {
            // @ts-expect-error Testing invalid input
            const result = attachSyncChannel(null);
            expect(result.isErr()).toBe(true);
            expect(result.unwrapErr()).toBeInstanceOf(TypeError);
            expect(result.unwrapErr().message).toBe('sharedBuffer must be a SharedArrayBuffer');
        });

        it('should use default opTimeout when options is undefined', () => {
            const sab = new SharedArrayBuffer(1024);
            // Call without options to trigger default behavior
            const result = attachSyncChannel(sab);
            expect(result.isOk()).toBe(true);
        });

        it('should return Err when opTimeout is not a positive integer', () => {
            const sab = new SharedArrayBuffer(1024);
            
            // Test with negative number
            const result1 = attachSyncChannel(sab, { opTimeout: -1 });
            expect(result1.isErr()).toBe(true);
            expect(result1.unwrapErr()).toBeInstanceOf(TypeError);
            expect(result1.unwrapErr().message).toBe('opTimeout must be a positive integer');

            // Test with zero
            const result2 = attachSyncChannel(sab, { opTimeout: 0 });
            expect(result2.isErr()).toBe(true);
            expect(result2.unwrapErr().message).toBe('opTimeout must be a positive integer');

            // Test with non-integer
            const result3 = attachSyncChannel(sab, { opTimeout: 1.5 });
            expect(result3.isErr()).toBe(true);
            expect(result3.unwrapErr().message).toBe('opTimeout must be a positive integer');

            // Test with NaN
            const result4 = attachSyncChannel(sab, { opTimeout: NaN });
            expect(result4.isErr()).toBe(true);
            expect(result4.unwrapErr().message).toBe('opTimeout must be a positive integer');
        });
    });
});
