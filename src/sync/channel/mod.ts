/**
 * SyncChannel namespace exports.
 * Provides a clean API for managing sync channel lifecycle.
 *
 * @example
 * ```typescript
 * import { SyncChannel } from 'happy-opfs';
 *
 * // Worker: start listening
 * SyncChannel.listen();
 *
 * // Main thread: connect to worker
 * const result = await SyncChannel.connect(worker);
 * result.inspect(sharedBuffer => {
 *     // Iframe: attach to existing channel
 *     SyncChannel.attach(sharedBuffer);
 * });
 *
 * // Check if ready
 * if (SyncChannel.isReady()) { ... }
 * ```
 *
 * @module
 */

// Main thread APIs
export { attachSyncChannel as attach, connectSyncChannel as connect, isSyncChannelReady as isReady } from './connect.ts';
// Worker thread API
export { listenSyncChannel as listen } from './listen.ts';
