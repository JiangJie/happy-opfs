/**
 * Worker to test isSyncAgentConnected in an isolated context
 */
import { isSyncAgentConnected } from '../src/mod.ts';

// Test: Check initial state (should be false in worker context)
const initialState = isSyncAgentConnected();

// Report results back to main thread
postMessage({
    initialState,
});
