/**
 * SyncChannel connection APIs for main thread.
 * Provides functions for connecting, attaching, and checking sync channel status.
 *
 * @module
 */

import { Err, Ok, RESULT_VOID, type AsyncIOResult, type VoidIOResult } from 'happy-rusty';
import { Future } from 'tiny-future';
import type { AttachSyncChannelOptions, ConnectSyncChannelOptions } from '../../shared/mod.ts';
import { SyncMessenger } from '../protocol.ts';
import { getSyncChannelState, setGlobalSyncOpTimeout, setMessenger, setSyncChannelState } from './state.ts';

/**
 * Connects to a worker and establishes a sync channel for synchronous file system operations.
 * Must be called before using any sync API functions.
 *
 * @param worker - The worker to communicate with. Can be a `Worker` instance, a `URL`, or a URL string.
 * @param options - Optional configuration options for the sync channel.
 * @returns A promise that resolves with an `AsyncIOResult` containing the `SharedArrayBuffer` when the worker is ready.
 *          The returned buffer can be shared with other contexts (e.g., iframes) via `postMessage`.
 * @example
 * ```typescript
 * // Connect to worker and get SharedArrayBuffer
 * const result = await SyncChannel.connect(
 *     new URL('./worker.js', import.meta.url),
 *     { sharedBufferLength: 1024 * 1024, opTimeout: 5000 }
 * );
 * result.inspect(sharedBuffer => {
 *     // Share with iframe
 *     iframe.contentWindow.postMessage({ sharedBuffer }, '*');
 * });
 * ```
 */
export async function connectSyncChannel(worker: Worker | URL | string, options?: ConnectSyncChannelOptions): AsyncIOResult<SharedArrayBuffer> {
    if (typeof window === 'undefined') {
        return Err(new Error('connectSyncChannel can only be called in main thread'));
    }

    const state = getSyncChannelState();
    if (state === 'ready') {
        return Err(new Error('Sync channel already connected'));
    }
    if (state === 'connecting') {
        return Err(new Error('Sync channel is connecting'));
    }

    const {
        sharedBufferLength = 1024 * 1024,
        opTimeout = 1000,
    } = options ?? {};

    // check parameters
    if (!(worker instanceof Worker || worker instanceof URL || (typeof worker === 'string' && worker))) {
        return Err(new TypeError('worker must be a Worker, URL, or non-empty string'));
    }
    // Minimum buffer size: 16 bytes header + ~131 bytes for largest error response = 147 bytes
    // Using 256 (power of 2) for better memory alignment
    if (!(sharedBufferLength >= 256 && sharedBufferLength % 4 === 0)) {
        return Err(new TypeError('sharedBufferLength must be at least 256 and a multiple of 4'));
    }
    if (!(Number.isInteger(opTimeout) && opTimeout > 0)) {
        return Err(new TypeError('opTimeout must be a positive integer'));
    }

    // May throw if worker url is invalid
    let workerAdapter: Worker;
    try {
        workerAdapter = worker instanceof Worker
            ? worker
            : new Worker(worker);
    } catch (e) {
        return Err(e as Error);
    }

    // Set state after all validations pass
    setSyncChannelState('connecting');
    setGlobalSyncOpTimeout(opTimeout);

    const sab = new SharedArrayBuffer(sharedBufferLength);
    const channel = new MessageChannel();

    const future = new Future<SharedArrayBuffer>();

    // Use MessageChannel for isolated communication
    // port1 stays in main thread, port2 is transferred to worker
    channel.port1.onmessage = (): void => {
        setMessenger(new SyncMessenger(sab));
        future.resolve(sab);
    };

    workerAdapter.postMessage({ port: channel.port2, sab }, [channel.port2]);

    return Ok(await future.promise);
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
 * @returns A `VoidIOResult` indicating success or failure.
 * @example
 * ```typescript
 * // In iframe: receive SharedArrayBuffer from main page
 * window.addEventListener('message', (event) => {
 *     if (event.data.sharedBuffer) {
 *         const result = SyncChannel.attach(event.data.sharedBuffer, { opTimeout: 5000 });
 *         if (result.isOk()) {
 *             // Now sync APIs can be used
 *             const fileResult = readTextFileSync('/data/file.txt');
 *         }
 *     }
 * });
 * ```
 */
export function attachSyncChannel(sharedBuffer: SharedArrayBuffer, options?: AttachSyncChannelOptions): VoidIOResult {
    if (!(sharedBuffer instanceof SharedArrayBuffer)) {
        return Err(new TypeError('sharedBuffer must be a SharedArrayBuffer'));
    }

    const { opTimeout = 1000 } = options ?? {};
    if (!(Number.isInteger(opTimeout) && opTimeout > 0)) {
        return Err(new TypeError('opTimeout must be a positive integer'));
    }

    setGlobalSyncOpTimeout(opTimeout);
    setMessenger(new SyncMessenger(sharedBuffer));

    return RESULT_VOID;
}
