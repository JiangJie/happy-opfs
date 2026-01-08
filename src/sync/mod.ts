/**
 * Sync OPFS file system operations.
 *
 * This module provides synchronous file system operations via Web Workers.
 * - `worker_thread.ts`: Runs in Worker thread, handles async operations
 * - `main_thread.ts`: Runs in main thread, provides sync API
 *
 * @module
 */

export * from './main_thread.ts';
export type { SyncMessenger } from './protocol.ts';
export * from './worker_thread.ts';
