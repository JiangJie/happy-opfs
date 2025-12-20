/**
 * Sync Worker
 *
 * This worker handles synchronous file operations.
 * It must be loaded as a separate worker file.
 */

import { startSyncAgent } from '../src/mod.ts';

// Start the sync agent to handle requests from the main thread
startSyncAgent();
