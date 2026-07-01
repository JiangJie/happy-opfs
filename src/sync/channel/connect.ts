/**
 * SyncChannel connection APIs.
 * Provides functions for connecting, attaching, and checking sync channel status.
 *
 * @module
 */

import { Err, Ok, RESULT_VOID, type AsyncIOResult, type VoidIOResult } from 'happy-rusty';
import { Future } from 'tiny-future';
import { TIMEOUT_ERROR } from '../../shared/mod.ts';
import type { AttachSyncChannelOptions, ConnectSyncChannelOptions } from '../../shared/mod.ts';
import { SyncMessenger } from '../protocol.ts';
import { getSyncChannelState, setGlobalSyncOpTimeout, setMessenger, setSyncChannelState } from './state.ts';

// #region Internal Variables

/**
 * Default size of SharedArrayBuffer in bytes (1MB).
 */
const DEFAULT_BUFFER_LENGTH = 1024 * 1024;

/**
 * Minimum required buffer size in bytes.
 * 16 bytes header + ~131 bytes for largest error response = 147 bytes.
 * Using 256 (power of 2) for better memory alignment.
 */
const MIN_BUFFER_LENGTH = 256;

/**
 * Default timeout for sync operations in milliseconds.
 */
const DEFAULT_OP_TIMEOUT = 1000;

/**
 * Default timeout for establishing the connection in milliseconds.
 * Covers worker startup, script load, and `SyncChannel.listen()` readiness.
 */
const DEFAULT_CONNECT_TIMEOUT = 10000;

// #endregion

/**
 * Connects to a worker and establishes a sync channel for synchronous file system operations.
 * Must be called before using any sync API functions.
 *
 * @param worker - The worker to communicate with. Can be a `Worker` instance, a `URL`, or a URL string.
 * @param options - Optional configuration options for the sync channel.
 * @returns A promise that resolves with an `AsyncIOResult` containing the `SharedArrayBuffer` when the worker is ready.
 *          The returned buffer can be shared with other contexts (e.g., iframes) via `postMessage`.
 * @since 1.1.0
 * @example
 * ```typescript
 * // Connect to worker and get SharedArrayBuffer
 * const result = await SyncChannel.connect(
 *     new URL('./worker.js', import.meta.url),
 *     { sharedBufferLength: 1024 * 1024, opTimeout: 5000, connectTimeout: 10000 }
 * );
 * result.inspect(sharedBuffer => {
 *     // Share with iframe
 *     iframe.contentWindow.postMessage({ sharedBuffer }, '*');
 * });
 * ```
 */
export async function connectSyncChannel(worker: Worker | URL | string, options?: ConnectSyncChannelOptions): AsyncIOResult<SharedArrayBuffer> {
    const state = getSyncChannelState();
    if (state === 'ready') {
        return Err(new Error('Sync channel already connected'));
    }
    if (state === 'connecting') {
        return Err(new Error('Sync channel is connecting'));
    }

    const {
        sharedBufferLength = DEFAULT_BUFFER_LENGTH,
        opTimeout = DEFAULT_OP_TIMEOUT,
        connectTimeout = DEFAULT_CONNECT_TIMEOUT,
    } = options ?? {};

    // check parameters
    if (!(worker instanceof Worker || worker instanceof URL || (typeof worker === 'string' && worker))) {
        return Err(new TypeError('worker must be a Worker, URL, or non-empty string'));
    }
    if (!(sharedBufferLength >= MIN_BUFFER_LENGTH && sharedBufferLength % 4 === 0)) {
        return Err(new TypeError('sharedBufferLength must be at least 256 and a multiple of 4'));
    }
    if (!(Number.isInteger(opTimeout) && opTimeout > 0)) {
        return Err(new TypeError('opTimeout must be a positive integer'));
    }
    if (!(Number.isInteger(connectTimeout) && connectTimeout > 0)) {
        return Err(new TypeError('connectTimeout must be a positive integer'));
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

    // Whether this function created the worker. Only owned workers may be
    // terminated on failure; caller-supplied Workers are left intact.
    const ownsWorker = !(worker instanceof Worker);

    // Shared teardown: clear the timer and detach all event sources
    // (error listener + port onmessage). Called exactly once — success and
    // failure paths below are the only callers, and teardown detaches every
    // other event source, so no second caller can reach teardown again.
    const teardown = (): void => {
        clearTimeout(timer);
        workerAdapter.removeEventListener('error', onError);
        channel.port1.onmessage = null;
    };

    // Failure path: close port, terminate owned worker, reset state so the
    // caller may retry, and reject the future — connectSyncChannel returns
    // Err instead of hanging forever when the worker never calls
    // SyncChannel.listen().
    const cleanup = (reason: unknown): void => {
        teardown();
        channel.port1.close();
        if (ownsWorker) {
            workerAdapter.terminate();
        }
        setSyncChannelState('idle');
        future.reject(reason);
    };

    const onError = (e: ErrorEvent): void => {
        cleanup(e.error ?? new Error(e.message || 'Worker failed to load'));
    };

    const timer = setTimeout(
        () => cleanup(new DOMException('Sync channel connection timed out', TIMEOUT_ERROR)),
        connectTimeout,
    );

    workerAdapter.addEventListener('error', onError);

    // Use MessageChannel for the one-shot handshake only: worker sends a
    // single null payload via port2 once it has called SyncChannel.listen()
    // (see listen.ts). After that, all further communication goes through
    // the SharedArrayBuffer-based SyncMessenger, not this port — so the
    // onmessage handler fires exactly once and is detached by teardown().
    // port1 stays in main thread, port2 is transferred to worker.
    channel.port1.onmessage = (): void => {
        teardown();
        setMessenger(new SyncMessenger(sab));
        future.resolve(sab);
    };

    workerAdapter.postMessage({ port: channel.port2, sab }, [channel.port2]);

    try {
        return Ok(await future.promise);
    } catch (e) {
        // future.reject path already cleaned up state/resources
        return Err(e as Error);
    }
}

/**
 * Checks if the sync channel is ready to use.
 *
 * @returns `true` if ready, `false` otherwise.
 * @since 1.11.0
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
 * @since 1.8.5
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
    const state = getSyncChannelState();
    if (state === 'connecting') {
        return Err(new Error('Cannot attach: sync channel is connecting'));
    }

    if (!(sharedBuffer instanceof SharedArrayBuffer)) {
        return Err(new TypeError('sharedBuffer must be a SharedArrayBuffer'));
    }

    const { opTimeout = DEFAULT_OP_TIMEOUT } = options ?? {};
    if (!(Number.isInteger(opTimeout) && opTimeout > 0)) {
        return Err(new TypeError('opTimeout must be a positive integer'));
    }

    setGlobalSyncOpTimeout(opTimeout);
    setMessenger(new SyncMessenger(sharedBuffer));

    return RESULT_VOID;
}
