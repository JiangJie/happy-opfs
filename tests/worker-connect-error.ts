/**
 * Worker file that tests calling connectSyncAgent from worker thread
 * This should throw "Only can use in main thread" error
 */
import { connectSyncAgent } from '../src/worker/opfs_worker_adapter.ts';

// Try to call connectSyncAgent from worker - this should throw
try {
    connectSyncAgent({
        worker: '',
    });
    // If no error, post failure
    postMessage({ success: false, error: 'Expected error was not thrown' });
} catch (error) {
    // Expected error
    const err = error as Error;
    postMessage({
        success: true,
        errorName: err.name,
        errorMessage: err.message,
    });
}
