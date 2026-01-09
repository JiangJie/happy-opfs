/**
 * Sync OPFS file system operations.
 *
 * This module provides synchronous file system operations via Web Workers.
 * - `channel/listen.ts`: Runs in Worker thread, handles async operations
 * - `ops.ts`: Runs in main thread, provides sync API
 *
 * @module
 */

// Re-export sync file operation APIs
export * from './ops.ts';
// SyncChannel namespace for channel management APIs
export * as SyncChannel from './channel/mod.ts';
