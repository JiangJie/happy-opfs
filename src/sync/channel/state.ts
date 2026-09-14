/**
 * Internal shared state for sync channel.
 * This module is not exported publicly.
 *
 * @internal
 */

import type { SyncMessenger } from '../protocol.ts';

/**
 * State for sync channel.
 * - 'idle': Not initialized, can call connectSyncChannel or attachSyncChannel
 * - 'connecting': Connection in progress (only during connectSyncChannel)
 * - 'ready': Ready to use, messenger is available
 */
export type SyncChannelState = 'idle' | 'connecting' | 'ready';

/**
 * Current state of the sync channel.
 */
let syncChannelState: SyncChannelState = 'idle';

/**
 * Messenger instance for sync communication.
 * Only available when syncChannelState is 'ready'.
 */
let messenger: SyncMessenger | null = null;

/**
 * Worker created by `connectSyncChannel`, if it created one.
 * Only a library-owned worker may be terminated when the channel is released;
 * a caller-supplied worker or the worker behind an attached buffer keeps running.
 */
let ownedWorker: Worker | null = null;

/**
 * Global timeout for synchronous I/O operations in milliseconds.
 */
let globalSyncOpTimeout = 1000;

/**
 * Gets the current sync channel state.
 */
export function getSyncChannelState(): SyncChannelState {
    return syncChannelState;
}

/**
 * Sets the sync channel state.
 */
export function setSyncChannelState(state: SyncChannelState): void {
    syncChannelState = state;
}

/**
 * Gets the messenger instance.
 */
export function getMessenger(): SyncMessenger | null {
    return messenger;
}

/**
 * Sets the messenger instance and marks the channel as ready.
 */
export function setMessenger(m: SyncMessenger): void {
    messenger = m;
    syncChannelState = 'ready';
}

/**
 * Remembers the worker created by `connectSyncChannel` so it can be terminated later.
 */
export function setOwnedWorker(worker: Worker | null): void {
    ownedWorker = worker;
}

/**
 * Releases the channel state: drops the messenger and the owned-worker reference
 * and returns to 'idle', so `connect`/`attach` may be called again.
 *
 * @returns The worker that was owned by this context, if any. The caller decides
 *          whether to terminate it - this module holds no behaviour.
 */
export function resetSyncChannel(): Worker | null {
    const worker = ownedWorker;
    messenger = null;
    ownedWorker = null;
    syncChannelState = 'idle';

    return worker;
}

/**
 * Gets the global sync operation timeout.
 */
export function getGlobalSyncOpTimeout(): number {
    return globalSyncOpTimeout;
}

/**
 * Sets the global sync operation timeout.
 */
export function setGlobalSyncOpTimeout(timeout: number): void {
    globalSyncOpTimeout = timeout;
}
