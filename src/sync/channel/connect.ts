/**
 * SyncChannel connection APIs for main thread.
 * Provides functions for connecting, attaching, and checking sync channel status.
 *
 * @module
 */

import { Future } from 'tiny-future';
import invariant from 'tiny-invariant';
import type { AttachSyncChannelOptions, ConnectSyncChannelOptions } from '../../shared/mod.ts';
import { SyncMessenger } from '../protocol.ts';
import { getSyncChannelState, setGlobalSyncOpTimeout, setMessenger, setSyncChannelState } from './state.ts';

/**
 * Connects to a worker and establishes a sync channel for synchronous file system operations.
 * Must be called before using any sync API functions.
 *
 * @param worker - The worker to communicate with. Can be a `Worker` instance, a `URL`, or a URL string.
 * @param options - Optional configuration options for the sync channel.
 * @returns A promise that resolves with the `SharedArrayBuffer` when the worker is ready.
 *          The returned buffer can be shared with other contexts (e.g., iframes) via `postMessage`.
 * @throws {Error} If called outside the main thread or if already connected.
 * @example
 * ```typescript
 * // Connect to worker and get SharedArrayBuffer
 * const sharedBuffer = await SyncChannel.connect(
 *     new URL('./worker.js', import.meta.url),
 *     { sharedBufferLength: 1024 * 1024, opTimeout: 5000 }
 * );
 *
 * // Share with iframe
 * iframe.contentWindow.postMessage({ sharedBuffer }, '*');
 * ```
 */
export function connectSyncChannel(worker: Worker | URL | string, options?: ConnectSyncChannelOptions): Promise<SharedArrayBuffer> {
    invariant(typeof window !== 'undefined', () => 'connectSyncChannel can only be called in main thread');

    const state = getSyncChannelState();
    invariant(state !== 'ready', () => 'Sync channel already connected');
    invariant(state !== 'connecting', () => 'Sync channel is connecting');
    setSyncChannelState('connecting');

    const {
        sharedBufferLength = 1024 * 1024,
        opTimeout = 1000,
    } = options ?? {};

    // check parameters
    invariant(worker instanceof Worker || worker instanceof URL || (typeof worker === 'string' && worker), () => 'worker must be a Worker, URL, or non-empty string');
    // Minimum buffer size: 16 bytes header + ~131 bytes for largest error response = 147 bytes
    // Using 256 (power of 2) for better memory alignment
    invariant(sharedBufferLength >= 256 && sharedBufferLength % 4 === 0, () => 'sharedBufferLength must be at least 256 and a multiple of 4');
    invariant(Number.isInteger(opTimeout) && opTimeout > 0, () => 'opTimeout must be a positive integer');

    setGlobalSyncOpTimeout(opTimeout);

    const sab = new SharedArrayBuffer(sharedBufferLength);
    const channel = new MessageChannel();

    const future = new Future<SharedArrayBuffer>();

    const workerAdapter = worker instanceof Worker
        ? worker
        : new Worker(worker);

    // Use MessageChannel for isolated communication
    // port1 stays in main thread, port2 is transferred to worker
    channel.port1.onmessage = (): void => {
        setMessenger(new SyncMessenger(sab));
        future.resolve(sab);
    };

    workerAdapter.postMessage({ port: channel.port2, sab }, [channel.port2]);

    return future.promise;
}

/**
 * Checks if the sync channel is ready to use.
 *
 * @returns `true` if ready, `false` otherwise.
 * @example
 * ```typescript
 * if (!SyncChannel.isReady()) {
 *     await SyncChannel.connect(new URL('./worker.js', import.meta.url));
 * }
 * ```
 */
export function isSyncChannelReady(): boolean {
    return getSyncChannelState() === 'ready';
}

/**
 * Attaches to an existing `SharedArrayBuffer` for synchronous file system operations.
 * Used to share a sync channel connection with other contexts (e.g., iframes).
 *
 * After calling this function, sync APIs (e.g., `readFileSync`, `writeFileSync`)
 * can be used in the current context without calling `connect`.
 *
 * @param sharedBuffer - The `SharedArrayBuffer` received from another context.
 * @param options - Optional configuration options.
 * @throws {Error} If sharedBuffer is not a valid SharedArrayBuffer.
 * @example
 * ```typescript
 * // In iframe: receive SharedArrayBuffer from main page
 * window.addEventListener('message', (event) => {
 *     if (event.data.sharedBuffer) {
 *         SyncChannel.attach(event.data.sharedBuffer, { opTimeout: 5000 });
 *         // Now sync APIs can be used
 *         const result = readTextFileSync('/data/file.txt');
 *     }
 * });
 * ```
 */
export function attachSyncChannel(sharedBuffer: SharedArrayBuffer, options?: AttachSyncChannelOptions): void {
    invariant(sharedBuffer instanceof SharedArrayBuffer, () => 'sharedBuffer must be a SharedArrayBuffer');

    const { opTimeout = 1000 } = options ?? {};
    invariant(Number.isInteger(opTimeout) && opTimeout > 0, () => 'opTimeout must be a positive integer');

    setGlobalSyncOpTimeout(opTimeout);
    setMessenger(new SyncMessenger(sharedBuffer));
}
