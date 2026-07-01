/**
 * Tests for `SyncChannel.connect` failure paths.
 *
 * File is prefixed `00-` so it runs before `00-empty-root` and
 * `00-worker-timeout`, while the channel state is still `idle`.
 * Failed connections reset state back to `idle` (via the cleanup path),
 * so subsequent tests are not affected.
 */
import { describe, expect, it, vi } from 'vitest';
import { SyncChannel, TIMEOUT_ERROR } from '../src/mod.ts';

describe('SyncChannel.connect failure paths', () => {
    it('should return TimeoutError after connectTimeout when worker does not call listen', async () => {
        if (SyncChannel.isReady()) {
            console.warn('Skipping: sync channel already ready');
            return;
        }

        const result = await SyncChannel.connect(
            new URL('./worker-no-listen.ts', import.meta.url),
            { connectTimeout: 100 },
        );

        expect(result.isErr(), 'should fail instead of hanging').toBe(true);
        expect(result.unwrapErr().name, 'error should be TimeoutError').toBe(TIMEOUT_ERROR);
    });

    it('should reset state to idle after failure and allow retry instead of being stuck in connecting', async () => {
        if (SyncChannel.isReady()) {
            console.warn('Skipping: sync channel already ready');
            return;
        }

        // First connect fails (timeout)
        const first = await SyncChannel.connect(
            new URL('./worker-no-listen.ts', import.meta.url),
            { connectTimeout: 100 },
        );
        expect(first.isErr(), 'first connect should fail').toBe(true);
        expect(first.unwrapErr().name).toBe(TIMEOUT_ERROR);

        // Second connect: if state were stuck in 'connecting' it would return
        // Err("Sync channel is connecting") (plain Error, name === 'Error').
        // With state back to idle it takes the timeout path, name === TIMEOUT_ERROR.
        const second = await SyncChannel.connect(
            new URL('./worker-no-listen.ts', import.meta.url),
            { connectTimeout: 100 },
        );
        expect(second.isErr(), 'second connect should also fail').toBe(true);
        expect(second.unwrapErr().name, 'state should return to idle and take timeout path, not stuck in connecting').toBe(TIMEOUT_ERROR);
    });

    it('should return TypeError when connectTimeout is not a positive integer', async () => {
        if (SyncChannel.isReady()) {
            console.warn('Skipping: sync channel already ready');
            return;
        }

        const result = await SyncChannel.connect(
            new URL('./worker-no-listen.ts', import.meta.url),
            { connectTimeout: 0 },
        );

        expect(result.isErr(), 'parameter validation should fail').toBe(true);
        expect(result.unwrapErr()).toBeInstanceOf(TypeError);
        expect(result.unwrapErr().message).toContain('connectTimeout');
    });

    it('should return Err via error event when worker throws on load instead of hanging', async () => {
        if (SyncChannel.isReady()) {
            console.warn('Skipping: sync channel already ready');
            return;
        }

        // Create a worker that throws on load via a blob URL to trigger the
        // worker error event. connectTimeout is set long so the error event
        // fires before the timeout (proving the onError path is taken).
        const blob = new Blob([`throw new Error('worker load boom')`], { type: 'application/javascript' });
        const url = URL.createObjectURL(blob);

        const result = await SyncChannel.connect(url, { connectTimeout: 10000 });

        expect(result.isErr(), 'should fail instead of hanging').toBe(true);
        // Error event fires before timeout → error type is not TimeoutError
        expect(result.unwrapErr().name, 'should be triggered by worker error event, not timeout').not.toBe(TIMEOUT_ERROR);

        URL.revokeObjectURL(url);
    }, 15000);

    it('should not terminate caller-supplied Worker instance on failure', async () => {
        if (SyncChannel.isReady()) {
            console.warn('Skipping: sync channel already ready');
            return;
        }

        // Create a worker that throws on load, but the caller is responsible
        // for instantiation. ownsWorker is false → cleanup path should not
        // call worker.terminate().
        const blob = new Blob([`throw new Error('worker load boom')`], { type: 'application/javascript' });
        const url = URL.createObjectURL(blob);
        const worker = new Worker(url, { type: 'module' });
        const terminateSpy = vi.spyOn(worker, 'terminate');

        const result = await SyncChannel.connect(worker, { connectTimeout: 10000 });

        expect(result.isErr(), 'should fail').toBe(true);
        expect(result.unwrapErr().name, 'should be triggered by worker error event').not.toBe(TIMEOUT_ERROR);
        expect(terminateSpy, 'should not terminate caller worker when ownsWorker is false').not.toHaveBeenCalled();

        worker.terminate();
        URL.revokeObjectURL(url);
    }, 15000);

    it('should return Err when worker script fails to load (404)', async () => {
        if (SyncChannel.isReady()) {
            console.warn('Skipping: sync channel already ready');
            return;
        }

        // Point to a non-existent script: the worker error event fires
        // (e.error may be undefined), covering the right-hand side of
        // `e.error ?? new Error(...)` in onError.
        const result = await SyncChannel.connect(
            new URL('./non-existent-worker.ts', import.meta.url),
            { connectTimeout: 10000 },
        );

        expect(result.isErr(), 'should fail instead of hanging').toBe(true);
        expect(result.unwrapErr().name, 'should be triggered by worker error event, not timeout').not.toBe(TIMEOUT_ERROR);
    }, 15000);
});
