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
 * Main thread lock index in the Int32Array view of SharedArrayBuffer.
 * Used to synchronize main thread state.
 */
export const MAIN_LOCK_INDEX = 0;

/**
 * Worker thread lock index in the Int32Array view of SharedArrayBuffer.
 * Used to synchronize worker thread state.
 */
export const WORKER_LOCK_INDEX = 1;

/**
 * Data length index in the Int32Array view of SharedArrayBuffer.
 * Stores the byte length of the current payload.
 */
export const DATA_INDEX = 2;

/**
 * Main thread locked value (waiting for response).
 */
export const MAIN_LOCKED = 1;

/**
 * Main thread unlocked value (response ready or idle).
 * This is the default/initial state.
 */
export const MAIN_UNLOCKED = 0;

/**
 * Worker thread unlocked value (request ready to process).
 * Intentionally equals MAIN_LOCKED to simplify state machine.
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
 *
 * Buffer Layout (all values are Int32 at 4-byte boundaries):
 * ```
 * Offset  Size    Field           Description
 * ------  ----    -----           -----------
 * 0       4       MAIN_LOCK       Main thread state (0=unlocked/ready, 1=locked/waiting)
 * 4       4       WORKER_LOCK     Worker thread state (0=locked/idle, 1=unlocked/processing)
 * 8       4       DATA_LENGTH     Length of payload data in bytes
 * 12      4       RESERVED        Reserved for future use
 * 16+     var     PAYLOAD         Actual request/response binary data
 * ```
 *
 * Communication Flow:
 * 1. Main thread writes request to PAYLOAD, sets DATA_LENGTH
 * 2. Main thread sets MAIN_LOCK=1 (locked), WORKER_LOCK=1 (unlocked)
 * 3. Worker sees WORKER_LOCK=1, reads request, processes it
 * 4. Worker writes response to PAYLOAD, sets DATA_LENGTH
 * 5. Worker sets WORKER_LOCK=0 (locked), MAIN_LOCK=0 (unlocked)
 * 6. Main thread sees MAIN_LOCK=0, reads response
 *
 * @example
 * ```typescript
 * // Create messenger with 1MB buffer
 * const sab = new SharedArrayBuffer(1024 * 1024);
 * const messenger = new SyncMessenger(sab);
 * ```
 */
export class SyncMessenger {
    /**
     * Header size in bytes: 4 Int32 values = 16 bytes.
     * Payload data starts after this offset.
     */
    private static readonly HEADER_LENGTH = 4 * 4;

    /**
     * Int32 view for atomic lock operations.
     * Layout: [MAIN_LOCK, WORKER_LOCK, DATA_LENGTH, RESERVED]
     */
    readonly i32a: Int32Array;

    /**
     * Maximum payload size in bytes.
     * Calculated as: total buffer size - header length.
     * Requests/responses exceeding this limit will fail.
     */
    readonly maxDataLength: number;

    /**
     * Uint8 view for reading/writing binary payload.
     * Payload starts after the header.
     */
    private readonly u8a: Uint8Array;

    /**
     * Creates a new SyncMessenger instance.
     *
     * @param sab - The SharedArrayBuffer to use for cross-thread communication.
     *              Must be created in the main thread and transferred to the worker.
     */
    constructor(sab: SharedArrayBuffer) {
        this.i32a = new Int32Array(sab);
        this.u8a = new Uint8Array(sab);
        this.maxDataLength = sab.byteLength - SyncMessenger.HEADER_LENGTH;
    }

    /**
     * Writes payload data to the buffer after the header.
     *
     * @param data - The payload data to write.
     */
    setPayload(data: Uint8Array): void {
        this.u8a.set(data, SyncMessenger.HEADER_LENGTH);
    }

    /**
     * Reads payload data from the buffer.
     *
     * @param length - The number of bytes to read.
     * @returns A copy of the payload data.
     */
    getPayload(length: number): Uint8Array {
        return this.u8a.slice(SyncMessenger.HEADER_LENGTH, SyncMessenger.HEADER_LENGTH + length);
    }
}