/**
 * Worker that attempts to call SyncChannel.connect (which should fail).
 * Used to test the "Only can use in main thread" error.
 */
import { SyncChannel } from '../src/mod.ts';

self.addEventListener('message', async () => {
    const result = await SyncChannel.connect(
        self as unknown as Worker,
        {
            sharedBufferLength: 1024,
            opTimeout: 1000,
        },
    );
    if (result.isErr()) {
        self.postMessage({ error: result.unwrapErr().message });
    } else {
        self.postMessage({ error: null });
    }
});
