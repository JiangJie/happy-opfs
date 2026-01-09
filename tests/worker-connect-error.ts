/**
 * Worker that attempts to call SyncChannel.connect (which should fail).
 * Used to test the "Only can use in main thread" error.
 */
import { SyncChannel } from '../src/mod.ts';

self.addEventListener('message', async () => {
    try {
        await SyncChannel.connect(
            self as unknown as Worker,
            {
                sharedBufferLength: 1024,
                opTimeout: 1000,
            },
        );
        self.postMessage({ error: null });
    } catch (error) {
        self.postMessage({ error: (error as Error).message });
    }
});
