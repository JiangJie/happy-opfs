import type { IOResult } from 'happy-rusty';
import type { DirEntry, DirEntryLike, FileSystemFileHandleLike, FileSystemHandleLike } from '../fs/defines.ts';
import { isFileHandle } from '../fs/guards.ts';
import { createFile, mkdir, readDir, remove, stat, writeFile } from '../fs/opfs_core.ts';
import { appendFile, copy, emptyDir, exists, move, readBlobFile } from '../fs/opfs_ext.ts';
import { deleteTemp, mkTemp, pruneTemp } from '../fs/opfs_tmp.ts';
import { unzip } from '../fs/opfs_unzip.ts';
import { zip } from '../fs/opfs_zip.ts';
import type { ErrorLike, FileLike } from './defines.ts';
import { DATA_INDEX, decodeFromBuffer, encodeToBuffer, MAIN_LOCK_INDEX, MAIN_UNLOCKED, SyncMessenger, WORKER_LOCK_INDEX, WORKER_UNLOCKED, WorkerAsyncOp } from './shared.ts';

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
 * Serializes a `File` object to a plain object for cross-thread communication.
 *
 * @param file - The `File` object to serialize.
 * @returns A promise that resolves to a serializable `FileLike` object.
 */
async function serializeFile(file: File): Promise<FileLike> {
    const ab = await file.arrayBuffer();
    return {
        name: file.name,
        type: file.type,
        lastModified: file.lastModified,
        size: ab.byteLength,
        data: Array.from(new Uint8Array(ab)),
    };
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

    addEventListener('message', (event: MessageEvent<SharedArrayBuffer>) => {
        // created at main thread and transfer to worker
        const sab = event.data;

        if (!(sab instanceof SharedArrayBuffer)) {
            // Reset flag to allow retry on failure
            isStarted = false;
            throw new TypeError('Only can post SharedArrayBuffer to Worker');
        }

        messenger = new SyncMessenger(sab);

        // notify main thread that worker is ready
        postMessage(true);

        // start waiting for request
        runWorkerLoop();
    }, {
        once: true,
    });
}

/**
 * Handles incoming requests from main thread and sends responses.
 * This function runs in the worker thread and processes one request.
 *
 * @param messenger - The `SyncMessenger` instance for communication.
 * @param transfer - Async function that processes request data and returns response data.
 */
async function respondToMainFromWorker(messenger: SyncMessenger, transfer: (data: Uint8Array) => Promise<Uint8Array>): Promise<void> {
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
        response = encodeToBuffer([{
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
 * JSON.parse loses type info for some types, so we reconstruct them here.
 *
 * @param op - The operation type.
 * @param args - The arguments to deserialize.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function deserializeArgs(op: WorkerAsyncOp, args: any[]): void {
    if (op === WorkerAsyncOp.writeFile || op === WorkerAsyncOp.appendFile) {
        // Binary data was serialized as number[] for JSON transport, convert back to Uint8Array
        if (Array.isArray(args[1])) {
            args[1] = new Uint8Array(args[1]);
        }
    } else if (op === WorkerAsyncOp.pruneTemp) {
        // Date was serialized as ISO string, reconstruct Date object
        args[0] = new Date(args[0] as Date);
    }
}

/**
 * Serializes operation result based on operation type.
 * Different operations return different types that need specific serialization.
 *
 * @param op - The operation type.
 * @param result - The unwrapped result value.
 * @returns Serializable response data.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function serializeResult(op: WorkerAsyncOp, result: any): Promise<any> {
    switch (op) {
        case WorkerAsyncOp.readBlobFile: {
            // File object needs full serialization (name, type, size, lastModified, data)
            // serializeFile already converts data to number[] for JSON serialization
            return serializeFile(result as File);
        }
        case WorkerAsyncOp.readDir: {
            // Async iterator needs full materialization to array
            const iterator: AsyncIterableIterator<DirEntry> = result;
            const entries: DirEntryLike[] = [];

            for await (const { path, handle } of iterator) {
                // Convert FileSystemHandle to serializable object
                const handleLike = await serializeFileSystemHandle(handle);
                entries.push({
                    path,
                    handle: handleLike,
                });
            }

            return entries;
        }
        case WorkerAsyncOp.stat: {
            // FileSystemHandle needs serialization to plain object
            return serializeFileSystemHandle(result as FileSystemHandle);
        }
        case WorkerAsyncOp.zip: {
            // Uint8Array becomes number[] for JSON serialization
            return result instanceof Uint8Array ? Array.from(result) : result;
        }
        default: {
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
async function processRequest(data: Uint8Array): Promise<Uint8Array> {
    try {
        // Decode the request: [operation, ...arguments]
        const [op, ...args] = decodeFromBuffer<[WorkerAsyncOp, ...Parameters<typeof asyncOps[WorkerAsyncOp]>]>(data);

        deserializeArgs(op, args);

        const handle = asyncOps[op];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const res: IOResult<any> = await (handle as any)(...args);

        if (res.isErr()) {
            // Operation failed - encode error only: [serializedError]
            return encodeToBuffer([serializeError(res.unwrapErr())]);
        }

        // Operation succeeded - serialize and encode response: [null (no error), result]
        const rawResponse = await serializeResult(op, res.unwrap());
        return encodeToBuffer([null, rawResponse]);
    } catch (e) {
        return encodeToBuffer([serializeError(e as Error)]);
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