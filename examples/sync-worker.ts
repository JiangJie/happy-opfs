/**
 * Sync Worker
 *
 * This worker handles synchronous file operations.
 * It must be loaded as a separate worker file.
 */

import { SyncChannel } from '../src/mod.ts';

// Start listening for sync channel requests from the main thread
SyncChannel.listen();
