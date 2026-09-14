/**
 * Tests for the SyncChannel environment guards.
 *
 * Runs with the `00-` prefix so it gets its own browser context: it manipulates
 * globals and must start from an unconnected channel.
 */
import { describe, expect, it } from 'vite-plus/test';
import { SyncChannel } from '../src/mod.ts';

const workerUrl = new URL('./worker.ts', import.meta.url);

/**
 * Runs the task with `SharedArrayBuffer` removed, emulating a page that is not
 * cross-origin isolated (no COOP/COEP headers).
 */
async function emulateNonIsolatedPage<T>(task: () => T | Promise<T>): Promise<T> {
    const saved = globalThis.SharedArrayBuffer;
    expect(Reflect.deleteProperty(globalThis, 'SharedArrayBuffer')).toBe(true);

    try {
        return await task();
    } finally {
        globalThis.SharedArrayBuffer = saved;
    }
}

describe('SyncChannel environment guards', () => {
    it('should return Err from connect when SharedArrayBuffer is unavailable', async () => {
        const result = await emulateNonIsolatedPage(() => SyncChannel.connect(workerUrl));

        expect(result.isErr()).toBe(true);
        expect(result.unwrapErr().message).toContain('SharedArrayBuffer');
    });

    it('should return the environment error from attach when SharedArrayBuffer is unavailable', async () => {
        const result = await emulateNonIsolatedPage(() =>
            SyncChannel.attach({} as unknown as SharedArrayBuffer),
        );

        expect(result.isErr()).toBe(true);
        expect(result.unwrapErr().message).toContain('SharedArrayBuffer');
    });

    it('should return Err and stay retryable when the buffer cannot be allocated', async () => {
        const oversized = 2 ** 32; // Far beyond the maximum a browser can allocate

        const first = await SyncChannel.connect(workerUrl, { sharedBufferLength: oversized });
        expect(first.isErr()).toBe(true);

        // The retry must fail for the same reason, not because the channel was
        // left in the 'connecting' state by the failed attempt
        const second = await SyncChannel.connect(workerUrl, { sharedBufferLength: oversized });
        expect(second.isErr()).toBe(true);
        expect(second.unwrapErr().message).not.toContain('connecting');
        expect(SyncChannel.isReady()).toBe(false);
    });

    it('should not terminate a caller-supplied worker when the buffer cannot be allocated', async () => {
        const callerWorker = new Worker(new URL('./worker.ts', import.meta.url), {
            type: 'module',
        });

        try {
            const result = await SyncChannel.connect(callerWorker, {
                sharedBufferLength: 2 ** 32,
            });
            expect(result.isErr()).toBe(true);
        } finally {
            callerWorker.terminate();
        }
    });
});
