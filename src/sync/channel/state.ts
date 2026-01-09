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
