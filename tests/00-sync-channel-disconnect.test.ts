/**
 * Tests for SyncChannel.disconnect().
 *
 * Runs with the `00-` prefix so it gets its own browser context: it connects and
 * releases the channel, which must not leak into other test files.
 */
import { describe, expect, it } from 'vite-plus/test';
import { existsSync, SyncChannel } from '../src/mod.ts';

const workerUrl = new URL('./worker.ts', import.meta.url);
const connectOptions = { sharedBufferLength: 1024 * 1024, opTimeout: 5000 };

describe('SyncChannel.disconnect', () => {
    it('should release the channel, allow reconnecting, and be idempotent', async () => {
        const firstWorker = new Worker(workerUrl, { type: 'module' });
        const secondWorker = new Worker(workerUrl, { type: 'module' });

        try {
            const first = await SyncChannel.connect(firstWorker, connectOptions);
            expect(first.isOk()).toBe(true);
            expect(SyncChannel.isReady()).toBe(true);

            // The channel is usable
            expect(existsSync('/disconnect-probe').isOk()).toBe(true);

            // A caller-supplied worker is not owned by the library, so releasing
            // the channel just drops the connection
            expect(SyncChannel.disconnect().isOk()).toBe(true);
            expect(SyncChannel.isReady()).toBe(false);

            // Sync calls now fail fast instead of hanging on a released channel
            const afterDisconnect = existsSync('/disconnect-probe');
            expect(afterDisconnect.isErr()).toBe(true);
            expect(afterDisconnect.unwrapErr().message).toContain('not connected');

            // Disconnecting again is a no-op
            expect(SyncChannel.disconnect().isOk()).toBe(true);
            expect(SyncChannel.isReady()).toBe(false);

            // Reconnecting works - this is the recovery path for a stuck channel
            const second = await SyncChannel.connect(secondWorker, connectOptions);
            expect(second.isOk()).toBe(true);
            expect(SyncChannel.isReady()).toBe(true);
            expect(existsSync('/disconnect-probe').isOk()).toBe(true);

            // Leave the channel released for the rest of the suite
            expect(SyncChannel.disconnect().isOk()).toBe(true);
            expect(SyncChannel.isReady()).toBe(false);
        } finally {
            firstWorker.terminate();
            secondWorker.terminate();
        }
    });

    it('should terminate a worker it created from a url', async () => {
        // A classic worker is enough here: connect only needs the one-shot
        // handshake reply, no request has to be served
        const source = `
            self.onmessage = e => {
                const { port } = e.data;
                port.postMessage(null);
            };
        `;
        const workerBlobUrl = URL.createObjectURL(new Blob([source], { type: 'text/javascript' }));

        try {
            const result = await SyncChannel.connect(workerBlobUrl, connectOptions);
            expect(result.isOk()).toBe(true);
            expect(SyncChannel.isReady()).toBe(true);

            // This worker belongs to the library, so releasing the channel terminates it
            expect(SyncChannel.disconnect().isOk()).toBe(true);
            expect(SyncChannel.isReady()).toBe(false);
        } finally {
            URL.revokeObjectURL(workerBlobUrl);
        }
    });
});
