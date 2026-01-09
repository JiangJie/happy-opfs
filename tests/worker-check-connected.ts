/**
 * Worker to test SyncChannel.isReady in an isolated context
 */
import { SyncChannel } from '../src/mod.ts';

// Test: Check initial state (should be false in worker context)
const initialState = SyncChannel.isReady();

// Report results back to main thread
postMessage({
    initialState,
});
