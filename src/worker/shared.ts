import { textDecode, textEncode } from '../fs/codec.ts';

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
export const MAIN_LOCK_INDEX = 0;

/**
 * Worker thread lock index used in Int32Array.
 */
export const WORKER_LOCK_INDEX = 1;

/**
 * Data index used in Int32Array.
 */
export const DATA_INDEX = 2;

/**
 * Main thread locked value.
 */
export const MAIN_LOCKED = 1;

/**
 * Main thread unlocked value.
 * Default.
 */
export const MAIN_UNLOCKED = 0;

/**
 * Worker thread unlocked value.
 */
export const WORKER_UNLOCKED = MAIN_LOCKED;

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
    return textEncode(str);
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
    const str = textDecode(data);
    return JSON.parse(str);
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