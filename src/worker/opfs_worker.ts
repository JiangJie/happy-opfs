import type { IOResult } from 'happy-rusty';
import { textEncode } from '../fs/codec.ts';
import type { DirEntry, DirEntryLike, FileSystemFileHandleLike, FileSystemHandleLike } from '../fs/defines.ts';
import { readBlobSync } from '../fs/helpers.ts';
import { isFileHandle } from '../fs/guards.ts';
import { createFile, mkdir, readDir, readFile, remove, stat, writeFile } from '../fs/opfs_core.ts';
import { appendFile, copy, emptyDir, exists, move, readBlobFile } from '../fs/opfs_ext.ts';
import { deleteTemp, mkTemp, pruneTemp } from '../fs/opfs_tmp.ts';
import { unzip } from '../fs/opfs_unzip.ts';
import { zip } from '../fs/opfs_zip.ts';
import type { ErrorLike, FileMetadata } from './defines.ts';
import { DATA_INDEX, decodePayload, encodePayload, MAIN_LOCK_INDEX, MAIN_UNLOCKED, SyncMessenger, WORKER_LOCK_INDEX, WORKER_UNLOCKED, WorkerAsyncOp } from './shared.ts';

//----------------------------------------------------------------------
// Sync Agent Message Protocol
//----------------------------------------------------------------------

/**
 * Message sent from main thread to worker to initialize sync agent.
 * Uses MessageChannel for isolated communication.
 */
interface SyncAgentInitMessage {
    /**
     * MessagePort for dedicated communication back to main thread.
     */
    port: MessagePort;
    /**
     * SharedArrayBuffer for cross-thread synchronous communication.
     */
    sab: SharedArrayBuffer;
}

/**
 * Type guard to check if a message is a SyncAgentInitMessage.
 * @param data - The message data to check.
 * @returns `true` if the message is a valid SyncAgentInitMessage.
 */
function isSyncAgentInitMessage(data: unknown): data is SyncAgentInitMessage {
    if (data == null || typeof data !== 'object') {
        return false;
    }

    const message = data as SyncAgentInitMessage;
    return message.port instanceof MessagePort && message.sab instanceof SharedArrayBuffer;
}

//----------------------------------------------------------------------
// Worker Async Operations
//----------------------------------------------------------------------

/**
 * Serializes a `FileSystemHandle` to a plain object for cross-thread communication.
 *
 * @param handle - `FileSystemHandle` object.
 * @returns Serializable version of FileSystemHandle that is FileSystemHandleLike.
 */
async function serializeFileSystemHandle(handle: FileSystemHandle): Promise<FileSystemHandleLike> {
    const { name, kind } = handle;

    if (isFileHandle(handle)) {
        const file = await handle.getFile();
        const { size, lastModified, type } = file;

        const fileHandle: FileSystemFileHandleLike = {
            name,
            kind,
            type,
            size,
            lastModified,
        };

        return fileHandle;
    }

    const handleLike: FileSystemHandleLike = {
        name,
        kind,
    };

    return handleLike;
}

/**
 * Serializes an `Error` object to a plain object for cross-thread communication.
 *
 * @param error - The `Error` object to serialize, or `null`.
 * @returns A serializable `ErrorLike` object, or `null` if input is `null`.
 */
function serializeError(error: Error | null): ErrorLike | null {
    return error ? {
        name: error.name,
        message: error.message,
    } : error;
}

/**
 * Worker thread locked value.
 * Default.
 */
const WORKER_LOCKED = MAIN_UNLOCKED;

/**
 * Mapping of async operation enums to their corresponding OPFS functions.
 * Used by the worker loop to dispatch operations from the main thread.
 *
 * Key: `WorkerAsyncOp` enum value
 * Value: The async function to execute
 */
const asyncOps = {
    [WorkerAsyncOp.createFile]: createFile,
    [WorkerAsyncOp.mkdir]: mkdir,
    [WorkerAsyncOp.move]: move,
    [WorkerAsyncOp.readDir]: readDir,
    [WorkerAsyncOp.readFile]: readFile,
    [WorkerAsyncOp.remove]: remove,
    [WorkerAsyncOp.stat]: stat,
    [WorkerAsyncOp.writeFile]: writeFile,
    [WorkerAsyncOp.appendFile]: appendFile,
    [WorkerAsyncOp.copy]: copy,
    [WorkerAsyncOp.emptyDir]: emptyDir,
    [WorkerAsyncOp.exists]: exists,
    [WorkerAsyncOp.deleteTemp]: deleteTemp,
    [WorkerAsyncOp.mkTemp]: mkTemp,
    [WorkerAsyncOp.pruneTemp]: pruneTemp,
    [WorkerAsyncOp.readBlobFile]: readBlobFile,
    [WorkerAsyncOp.unzip]: unzip,
    [WorkerAsyncOp.zip]: zip,
};

/**
 * Cache the messenger instance.
 */
let messenger: SyncMessenger;

/**
 * Flag to track if startSyncAgent has been called.
 * Used to prevent multiple event listeners from being registered.
 */
let isStarted = false;

/**
 * Starts the sync agent in a Web Worker.
 * Listens for a SharedArrayBuffer from the main thread and begins processing requests.
 *
 * @throws {Error} If called outside a Worker context or if already started.
 * @example
 * ```typescript
 * // In worker.js
 * import { startSyncAgent } from 'happy-opfs';
 * startSyncAgent();
 * ```
 */
export function startSyncAgent(): void {
    if (typeof window !== 'undefined') {
        throw new Error('Only can use in worker');
    }

    if (isStarted) {
        throw new Error('Worker messenger already started');
    }

    isStarted = true;

    const messageHandler = (event: MessageEvent<unknown>): void => {
        const { data } = event;

        // Ignore messages that are not SyncAgentInitMessage
        if (!isSyncAgentInitMessage(data)) {
            return;
        }

        // Remove listener after receiving valid init message
        removeEventListener('message', messageHandler);

        const { port, sab } = data;

        messenger = new SyncMessenger(sab);

        // Notify main thread that worker is ready via dedicated MessagePort
        port.postMessage(null);

        // Start waiting for requests
        runWorkerLoop();
    };

    addEventListener('message', messageHandler);
}

/**
 * Handles incoming requests from main thread and sends responses.
 * This function runs in the worker thread and processes one request.
 *
 * @param messenger - The `SyncMessenger` instance for communication.
 * @param transfer - Async function that processes request data and returns response data.
 */
async function respondToMainFromWorker(messenger: SyncMessenger, transfer: (data: Uint8Array<SharedArrayBuffer>) => Promise<Uint8Array<ArrayBuffer>>): Promise<void> {
    const { i32a, maxDataLength } = messenger;

    // Busy-wait until main thread signals a request is ready
    // Using busy-wait instead of Atomics.wait() because Atomics.notify() may not work reliably cross-thread
    while (true) {
        if (Atomics.load(i32a, WORKER_LOCK_INDEX) === WORKER_UNLOCKED) {
            break;
        }
    }

    // payload and length
    const requestLength = i32a[DATA_INDEX];
    const data = messenger.getPayload(requestLength);

    // call async I/O operation
    let response = await transfer(data);

    // check whether response is too large
    if (response.byteLength > maxDataLength) {
        const message = `Response is too large: ${ response.byteLength } > ${ maxDataLength }. Consider increasing the size of SharedArrayBuffer`;

        // Error response is guaranteed to fit since bufferLength >= 256 bytes
        // and error response is ~147 bytes (16 header + 131 payload)
        response = encodePayload([{
            name: 'RangeError',
            message,
        }]);
    }

    // write response data
    i32a[DATA_INDEX] = response.byteLength;
    messenger.setPayload(response);

    // lock worker thread
    Atomics.store(i32a, WORKER_LOCK_INDEX, WORKER_LOCKED);

    // wakeup main thread
    Atomics.store(i32a, MAIN_LOCK_INDEX, MAIN_UNLOCKED);
}

/**
 * Deserializes request arguments based on operation type.
 * Binary data is received as the last element from the binary protocol.
 *
 * @param op - The operation type.
 * @param args - The arguments to deserialize.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function deserializeArgs(op: WorkerAsyncOp, args: any[]): void {
    if (op === WorkerAsyncOp.writeFile) {
        // Request format: [filePath, options?, Uint8Array]
        // Expected args: [filePath, Uint8Array, options?]
        // Move Uint8Array from last position to second position
        const data = args.pop() as Uint8Array;
        const options = args[1];
        args[1] = data;
        args[2] = options;
    } else if (op === WorkerAsyncOp.pruneTemp) {
        // Date was serialized as ISO string, reconstruct Date object
        args[0] = new Date(args[0] as Date);
    }
}

/**
 * Serializes a readDir result (async iterator) to an array of DirEntryLike.
 * Uses parallel processing for better performance since getFile() involves disk I/O.
 *
 * @param iterator - The async iterator from readDir.
 * @returns Promise resolving to array of serializable directory entries.
 */
async function serializeReadDirResult(iterator: AsyncIterableIterator<DirEntry>): Promise<DirEntryLike[]> {
    // Collect and serialize handles in parallel - getFile() involves disk I/O
    const tasks: Promise<DirEntryLike>[] = [];

    for await (const { path, handle } of iterator) {
        tasks.push((async () => ({
            path,
            handle: await serializeFileSystemHandle(handle),
        }))());
    }

    return Promise.all(tasks);
}

/**
 * Serializes operation result based on operation type.
 * Different operations return different types that need specific serialization.
 * Binary data is returned directly as the last element for binary protocol.
 *
 * Note: readDir and stat require async serialization and are handled separately in processRequest.
 *
 * @param op - The operation type.
 * @param result - The unwrapped result value.
 * @returns Serializable response data.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function serializeResult(op: WorkerAsyncOp, result: unknown): any {
    switch (op) {
        case WorkerAsyncOp.readFile: {
            // Return Uint8Array directly - it will be placed as the last element
            if (result instanceof ArrayBuffer) {
                return new Uint8Array(result);
            }
            if (result instanceof Uint8Array) {
                return result;
            }
            // String (utf8) -> Uint8Array
            return textEncode(result as string);
        }
        case WorkerAsyncOp.readBlobFile: {
            // Split file into [metadata, Uint8Array]
            // Caller will receive metadata as first element, Uint8Array as last
            const file = result as File;
            const metadata: FileMetadata = {
                name: file.name,
                type: file.type,
                lastModified: file.lastModified,
            };
            // Return as array - encodePayload will handle [null, metadata, Uint8Array]
            return [metadata, readBlobSync(file)];
        }
        default: {
            // readFile returns Uint8Array, zip returns Uint8Array or undefined
            // Other operations return boolean or void (undefined)
            return result;
        }
    }
}

/**
 * Processes a single request from the main thread.
 *
 * @param data - The encoded request data.
 * @returns The encoded response data.
 */
async function processRequest(data: Uint8Array<SharedArrayBuffer>): Promise<Uint8Array<ArrayBuffer>> {
    try {
        // Decode the request: [operation, ...arguments]
        const [op, ...args] = decodePayload<[WorkerAsyncOp, ...Parameters<typeof asyncOps[WorkerAsyncOp]>]>(data);

        deserializeArgs(op, args);

        const handle = asyncOps[op];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const res: IOResult<any> = await (handle as any)(...args);

        if (res.isErr()) {
            // Operation failed - encode error only: [serializedError]
            return encodePayload([serializeError(res.unwrapErr())]);
        }

        const result = res.unwrap();

        // Build response array: [null (no error), ...serialized result]
        const response: unknown[] = [null];

        // Serialize result based on operation type
        if (op === WorkerAsyncOp.readDir) {
            response.push(await serializeReadDirResult(result as AsyncIterableIterator<DirEntry>));
        } else if (op === WorkerAsyncOp.stat) {
            response.push(await serializeFileSystemHandle(result as FileSystemHandle));
        } else {
            const rawResponse = serializeResult(op, result);
            // For readBlobFile, rawResponse is [metadata, Uint8Array], spread it
            if (op === WorkerAsyncOp.readBlobFile) {
                response.push(...rawResponse);
            } else {
                response.push(rawResponse);
            }
        }

        return encodePayload(response);
    } catch (e) {
        return encodePayload([serializeError(e as Error)]);
    }
}

/**
 * Main loop that continuously processes requests from the main thread.
 * Runs indefinitely until the worker is terminated.
 */
async function runWorkerLoop(): Promise<void> {
    // No try-catch needed:
    // - processRequest catches all exceptions and returns encoded error response
    // - respondToMainFromWorker never throws (error response always fits in buffer >= 256 bytes)
    while (true) {
        await respondToMainFromWorker(messenger, processRequest);
    }
}