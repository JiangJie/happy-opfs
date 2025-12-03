import { sleepUntil } from './helpers.ts';

/**
 * Enumeration of async I/O operations that can be called from main thread to worker thread.
 * Each value corresponds to a specific file system operation.
 * @internal
 */
export const enum WorkerAsyncOp {
    // core
    createFile,
    mkdir,
    move,
    readDir,
    remove,
    stat,
    writeFile,
    // ext
    appendFile,
    copy,
    emptyDir,
    exists,
    deleteTemp,
    mkTemp,
    pruneTemp,
    readBlobFile,
    unzip,
    zip,
}

/**
 * Main thread lock index used in Int32Array.
 */
const MAIN_LOCK_INDEX = 0;

/**
 * Worker thread lock index used in Int32Array.
 */
const WORKER_LOCK_INDEX = 1;

/**
 * Data index used in Int32Array.
 */
const DATA_INDEX = 2;

/**
 * Main thread locked value.
 */
const MAIN_LOCKED = 1;

/**
 * Main thread unlocked value.
 * Default.
 */
const MAIN_UNLOCKED = 0;

/**
 * Worker thread locked value.
 * Default.
 */
const WORKER_LOCKED = MAIN_UNLOCKED;

/**
 * Worker thread unlocked value.
 */
const WORKER_UNLOCKED = MAIN_LOCKED;

/**
 * Cache the `TextEncoder` instance.
 */
let encoder: TextEncoder;

/**
 * Cache the `TextDecoder` instance.
 */
let decoder: TextDecoder;

/**
 * Get the cached `TextEncoder` instance.
 * @returns Instance of `TextEncoder`.
 */
function getEncoder(): TextEncoder {
    encoder ??= new TextEncoder();
    return encoder;
}

/**
 * Get the cached `TextDecoder` instance.
 * @returns Instance of `TextDecoder`.
 */
function getDecoder(): TextDecoder {
    decoder ??= new TextDecoder();
    return decoder;
}

/**
 * Encodes data to a binary buffer for cross-thread communication.
 * Uses JSON serialization internally.
 *
 * @template T - The type of data to encode.
 * @param data - The data to encode.
 * @returns A `Uint8Array` containing the encoded data.
 * @example
 * ```typescript
 * const buffer = encodeToBuffer({ op: 'read', path: '/file.txt' });
 * ```
 */
export function encodeToBuffer<T>(data: T): Uint8Array {
    const str = JSON.stringify(data);
    return getEncoder().encode(str);
}

/**
 * Decodes binary data back to its original type.
 * Reverses the `encodeToBuffer` operation.
 *
 * @template T - The expected type of the decoded data.
 * @param data - The binary data to decode.
 * @returns The decoded data.
 * @example
 * ```typescript
 * const result = decodeFromBuffer<{ op: string; path: string }>(buffer);
 * ```
 */
export function decodeFromBuffer<T>(data: Uint8Array): T {
    const str = decodeToString(data);
    return JSON.parse(str);
}

/**
 * Decodes binary data to a UTF-8 string.
 *
 * @param data - The binary data to decode.
 * @returns The decoded string.
 */
export function decodeToString(data: Uint8Array): string {
    return getDecoder().decode(data);
}

/**
 * Messenger for synchronous communication between main thread and worker thread.
 * Inspired by [memfs](https://github.com/streamich/memfs/blob/master/src/fsa-to-node/worker/SyncMessenger.ts).
 *
 * Uses a `SharedArrayBuffer` with lock-based synchronization via `Atomics`.
 * The buffer layout is:
 * - Bytes 0-3: Main thread lock (Int32)
 * - Bytes 4-7: Worker thread lock (Int32)
 * - Bytes 8-11: Data length (Int32)
 * - Bytes 12-15: Reserved
 * - Bytes 16+: Payload data
 *
 * @example
 * ```typescript
 * const sab = new SharedArrayBuffer(1024 * 1024);
 * const messenger = new SyncMessenger(sab);
 * ```
 */
export class SyncMessenger {
    /** Int32 view for lock operations. */
    readonly i32a: Int32Array;
    /** Uint8 view for reading/writing binary payload. */
    readonly u8a: Uint8Array;
    /** Header size in bytes (4 Int32 values = 16 bytes). */
    readonly headerLength = 4 * 4;
    /** Maximum payload size in bytes. */
    readonly maxDataLength: number;

    /**
     * Creates a new SyncMessenger.
     *
     * @param sab - The SharedArrayBuffer to use for communication.
     */
    constructor(sab: SharedArrayBuffer) {
        this.i32a = new Int32Array(sab);
        this.u8a = new Uint8Array(sab);
        this.maxDataLength = sab.byteLength - this.headerLength;
    }
}

/**
 * Sends a synchronous request from main thread to worker and waits for response.
 * This function blocks the main thread until the worker responds.
 *
 * @param messenger - The `SyncMessenger` instance for communication.
 * @param data - The request data as a `Uint8Array`.
 * @returns The response data as a `Uint8Array`.
 * @throws {RangeError} If the request data exceeds the buffer's maximum capacity.
 */
export function callWorkerFromMain(messenger: SyncMessenger, data: Uint8Array): Uint8Array {
    const { i32a, u8a, headerLength, maxDataLength } = messenger;
    const requestLength = data.byteLength;

    // check whether request is too large
    if (requestLength > maxDataLength) {
        throw new RangeError(`Request is too large: ${ requestLength } > ${ maxDataLength }. Consider grow the size of SharedArrayBuffer.`);
    }

    // lock main thread
    Atomics.store(i32a, MAIN_LOCK_INDEX, MAIN_LOCKED);

    // payload and length
    i32a[DATA_INDEX] = requestLength;
    u8a.set(data, headerLength);

    // wakeup worker
    // Atomics.notify(i32a, WORKER_LOCK_INDEX); // this may not work
    Atomics.store(i32a, WORKER_LOCK_INDEX, WORKER_UNLOCKED);

    // wait for worker to finish
    sleepUntil(() => Atomics.load(i32a, MAIN_LOCK_INDEX) === MAIN_UNLOCKED);

    // worker return
    const responseLength = i32a[DATA_INDEX];
    const response = u8a.slice(headerLength, headerLength + responseLength);

    return response;
}

/**
 * Handles incoming requests from main thread and sends responses.
 * This function runs in the worker thread and processes one request.
 *
 * @param messenger - The `SyncMessenger` instance for communication.
 * @param transfer - Async function that processes request data and returns response data.
 * @throws {RangeError} If the response data exceeds the buffer's maximum capacity.
 */
export async function respondToMainFromWorker(messenger: SyncMessenger, transfer: (data: Uint8Array) => Promise<Uint8Array>): Promise<void> {
    const { i32a, u8a, headerLength, maxDataLength } = messenger;

    while (true) {
        if (Atomics.load(i32a, WORKER_LOCK_INDEX) === WORKER_UNLOCKED) {
            break;
        }
    }

    // because of `Atomics.notify` may not work
    // const waitRes = Atomics.wait(i32a, WORKER_LOCK_INDEX, WORKER_LOCKED);
    // if (waitRes !== 'ok') {
    //     throw new Error(`Unexpected Atomics.wait result: ${ waitRes }`);
    // }

    // payload and length
    const requestLength = i32a[DATA_INDEX];
    // console.log(`requestLength: ${ requestLength }`);
    const data = u8a.slice(headerLength, headerLength + requestLength);

    // call async I/O operation
    let response = await transfer(data);
    const responseLength = response.byteLength;

    // check whether response is too large
    if (responseLength > maxDataLength) {
        const message = `Response is too large: ${ responseLength } > ${ maxDataLength }. Consider grow the size of SharedArrayBuffer.`;

        response = encodeToBuffer([{
            name: 'RangeError',
            message,
        }]);

        // the error is too large?
        if (response.byteLength > maxDataLength) {
            // lock worker thread before throw
            Atomics.store(i32a, WORKER_LOCK_INDEX, WORKER_LOCKED);

            throw new RangeError(message);
        }
    }

    // write response data
    i32a[DATA_INDEX] = response.byteLength;
    u8a.set(response, headerLength);

    // lock worker thread
    Atomics.store(i32a, WORKER_LOCK_INDEX, WORKER_LOCKED);

    // wakeup main thread
    Atomics.store(i32a, MAIN_LOCK_INDEX, MAIN_UNLOCKED);
}