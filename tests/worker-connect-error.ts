/**
 * Worker that attempts to call connectSyncAgent (which should fail).
 * Used to test the "Only can use in main thread" error.
 */
import { connectSyncAgent } from '../src/mod.ts';

self.addEventListener('message', async () => {
    try {
        await connectSyncAgent({
            worker: self as unknown as Worker,
            bufferLength: 1024,
            opTimeout: 1000,
        });
        self.postMessage({ error: null });
    } catch (error) {
        self.postMessage({ error: (error as Error).message });
    }
});
