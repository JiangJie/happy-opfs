import { textDecode, textEncode } from '../fs/codec.ts';

/**
 * Payload type markers for binary protocol.
 * @internal
 */
export const enum PayloadType {
    /**
     * Pure JSON payload, no binary data.
     * Format: [type: 1B][json bytes]
     */
    JSON = 0,
    /**
     * JSON payload with separate binary data field.
     * Binary data is stored separately to avoid JSON serialization overhead.
     * Format: [type: 1B][json length: 4B][json bytes][binary bytes]
     */
    BINARY_JSON = 1,
}

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
    readFile,
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
 * @internal
 */
export const MAIN_LOCK_INDEX = 0;

/**
 * Worker thread lock index in the Int32Array view of SharedArrayBuffer.
 * Used to synchronize worker thread state.
 * @internal
 */
export const WORKER_LOCK_INDEX = 1;

/**
 * Data length index in the Int32Array view of SharedArrayBuffer.
 * Stores the byte length of the current payload.
 * @internal
 */
export const DATA_INDEX = 2;

/**
 * Main thread locked value (waiting for response).
 * @internal
 */
export const MAIN_LOCKED = 1;

/**
 * Main thread unlocked value (response ready or idle).
 * This is the default/initial state.
 * @internal
 */
export const MAIN_UNLOCKED = 0;

/**
 * Worker thread unlocked value (request ready to process).
 * Intentionally equals MAIN_LOCKED to simplify state machine.
 * @internal
 */
export const WORKER_UNLOCKED = MAIN_LOCKED;

/**
 * Encodes data to a binary buffer for cross-thread communication.
 * Uses JSON serialization with optional binary data separation.
 *
 * If the last element of the array is a Uint8Array, it is stored separately
 * to avoid JSON serialization overhead (which would convert to number[]).
 *
 * All requests/responses use array format: `[op, ...args]` or `[error, result]`.
 *
 * @param value - The array data to encode.
 * @returns A `Uint8Array` containing the encoded payload.
 * @internal
 */
export function encodePayload(value: unknown[]): Uint8Array<ArrayBuffer> {
    const lastItem = value[value.length - 1];

    // If the last element is a Uint8Array, store it separately
    if (lastItem instanceof Uint8Array) {
        // BINARY_JSON format: [type: 1B][json length: 4B][json bytes][binary bytes]
        const jsonValue = value.slice(0, -1);
        const json = textEncode(JSON.stringify(jsonValue));
        const result = new Uint8Array(1 + 4 + json.byteLength + lastItem.byteLength);
        result[0] = PayloadType.BINARY_JSON;
        new DataView(result.buffer).setUint32(1, json.byteLength);
        result.set(json, 5);
        result.set(lastItem, 5 + json.byteLength);
        return result;
    }

    // JSON format: [type: 1B][json bytes]
    const json = textEncode(JSON.stringify(value));
    const result = new Uint8Array(1 + json.byteLength);
    result[0] = PayloadType.JSON;
    result.set(json, 1);
    return result;
}

/**
 * Decodes binary payload back to its original structure.
 * Reverses the `encodePayload` operation.
 *
 * For BINARY_JSON payloads, the binary data is restored as the last element.
 *
 * All requests/responses use array format: `[op, ...args]` or `[error, result]`.
 *
 * @template T - The expected type of the decoded data (must be an array type).
 * @param payload - The binary payload from SharedArrayBuffer to decode.
 * @returns The decoded array with Uint8Array<ArrayBuffer> restored as the last element if applicable.
 * @internal
 */
export function decodePayload<T extends unknown[]>(payload: Uint8Array<SharedArrayBuffer>): T {
    const type = payload[0];

    if (type === PayloadType.BINARY_JSON) {
        // BINARY_JSON format: [type: 1B][json length: 4B][json bytes][binary bytes]
        const jsonLen = new DataView(payload.buffer, payload.byteOffset + 1, 4).getUint32(0);
        // Use slice() for both json and data:
        // 1. TextDecoder cannot accept SharedArrayBuffer views (browser security restriction)
        // 2. Returned data needs its own ArrayBuffer (caller may access .buffer property)
        const json = payload.slice(5, 5 + jsonLen);
        const data = payload.slice(5 + jsonLen);
        const parsed: unknown[] = JSON.parse(textDecode(json));

        // Restore binary data as the last element
        parsed.push(data);

        return parsed as T;
    }

    // JSON format: [type: 1B][json bytes]
    // Use slice() because TextDecoder cannot accept SharedArrayBuffer views
    return JSON.parse(textDecode(payload.slice(1)));
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
    private readonly u8a: Uint8Array<SharedArrayBuffer>;

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
     * Reads payload data from the buffer as a view.
     *
     * Note: Returns a subarray (view) of the SharedArrayBuffer.
     * Caller must use slice() if they need to pass data to TextDecoder
     * or return data to user code that may access .buffer property.
     *
     * @param length - The number of bytes to read.
     * @returns A view into the SharedArrayBuffer payload region.
     */
    getPayload(length: number): Uint8Array<SharedArrayBuffer> {
        return this.u8a.subarray(SyncMessenger.HEADER_LENGTH, SyncMessenger.HEADER_LENGTH + length);
    }
}