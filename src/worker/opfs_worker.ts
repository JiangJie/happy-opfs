import type { IOResult } from 'happy-rusty';
import type { DirEntry, DirEntryLike, FileSystemFileHandleLike, FileSystemHandleLike } from '../fs/defines.ts';
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

    if (handle.kind === 'file') {
        const file = await (handle as FileSystemFileHandle).getFile();
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

    if (messenger) {
        throw new Error('Worker messenger already started');
    }

    addEventListener('message', (event: MessageEvent<SharedArrayBuffer>) => {
        // created at main thread and transfer to worker
        const sab = event.data;

        if (!(sab instanceof SharedArrayBuffer)) {
            throw new TypeError('Only can post SharedArrayBuffer to Worker');
        }

        messenger = new SyncMessenger(sab);

        // notify main thread that worker is ready
        postMessage(true);

        // start waiting for request
        runWorkerLoop();
    });
}

/**
 * Handles incoming requests from main thread and sends responses.
 * This function runs in the worker thread and processes one request.
 *
 * @param messenger - The `SyncMessenger` instance for communication.
 * @param transfer - Async function that processes request data and returns response data.
 * @throws {RangeError} If the response data exceeds the buffer's maximum capacity.
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

    // because of `Atomics.notify` may not work
    // const waitRes = Atomics.wait(i32a, WORKER_LOCK_INDEX, WORKER_LOCKED);
    // if (waitRes !== 'ok') {
    //     throw new Error(`Unexpected Atomics.wait result: ${ waitRes }`);
    // }

    // payload and length
    const requestLength = i32a[DATA_INDEX];
    // console.log(`requestLength: ${ requestLength }`);
    const data = messenger.getPayload(requestLength);

    // call async I/O operation
    let response = await transfer(data);
    const responseLength = response.byteLength;

    // check whether response is too large
    if (responseLength > maxDataLength) {
        const message = `Response is too large: ${ responseLength } > ${ maxDataLength }. Consider increasing the size of SharedArrayBuffer`;

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
    messenger.setPayload(response);

    // lock worker thread
    Atomics.store(i32a, WORKER_LOCK_INDEX, WORKER_LOCKED);

    // wakeup main thread
    Atomics.store(i32a, MAIN_LOCK_INDEX, MAIN_UNLOCKED);
}

/**
 * Main loop that continuously processes requests from the main thread.
 * Runs indefinitely until the worker is terminated.
 */
async function runWorkerLoop(): Promise<void> {
    // loop forever
    while (true) {
        try {
            await respondToMainFromWorker(messenger, async (data) => {
                // Decode the request: [operation, ...arguments]
                const [op, ...args] = decodeFromBuffer<[WorkerAsyncOp, ...Parameters<typeof asyncOps[WorkerAsyncOp]>]>(data);

                // Handle parameter deserialization for specific operations
                // JSON.parse loses type info for some types, so we reconstruct them here
                if (op === WorkerAsyncOp.writeFile || op === WorkerAsyncOp.appendFile) {
                    // Binary data was serialized as number[] for JSON transport, convert back to Uint8Array
                    if (Array.isArray(args[1])) {
                        args[1] = new Uint8Array(args[1]);
                    }
                } else if (op === WorkerAsyncOp.pruneTemp) {
                    // Date was serialized as ISO string, reconstruct Date object
                    args[0] = new Date(args[0] as Date);
                }

                let response: Uint8Array;

                const handle = asyncOps[op];

                try {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const res: IOResult<any> = await (handle as any)(...args);

                    if (res.isErr()) {
                        // Operation failed - encode error only: [serializedError]
                        response = encodeToBuffer([serializeError(res.unwrapErr())]);
                    } else {
                        // Operation succeeded - serialize response based on operation type
                        // Different operations return different types that need specific serialization
                        let rawResponse;

                        if (op === WorkerAsyncOp.readBlobFile) {
                            // File object needs full serialization (name, type, size, lastModified, data)
                            const file: File = res.unwrap();
                            const fileLike = await serializeFile(file);

                            rawResponse = {
                                ...fileLike,
                                // ArrayBuffer becomes number[] for JSON serialization
                                data: Array.from(new Uint8Array(fileLike.data)),
                            };
                        } else if (op === WorkerAsyncOp.readDir) {
                            // Async iterator needs full materialization to array
                            const iterator: AsyncIterableIterator<DirEntry> = res.unwrap();
                            const entries: DirEntryLike[] = [];

                            for await (const { path, handle } of iterator) {
                                // Convert FileSystemHandle to serializable object
                                const handleLike = await serializeFileSystemHandle(handle);
                                entries.push({
                                    path,
                                    handle: handleLike,
                                });
                            }

                            rawResponse = entries;
                        } else if (op === WorkerAsyncOp.stat) {
                            // FileSystemHandle needs serialization to plain object
                            const handle: FileSystemHandle = res.unwrap();
                            const data = await serializeFileSystemHandle(handle);

                            rawResponse = data;
                        } else if (op === WorkerAsyncOp.zip) {
                            // Uint8Array becomes number[] for JSON serialization
                            const data: Uint8Array | undefined = res.unwrap();

                            rawResponse = data instanceof Uint8Array ? Array.from(data) : data;
                        } else {
                            // Other operations return boolean or void (undefined)
                            rawResponse = res.unwrap();
                        }

                        // Encode success response: [null (no error), result]
                        response = encodeToBuffer([null, rawResponse]);
                    }
                } catch (e) {
                    response = encodeToBuffer([serializeError(e as Error)]);
                }

                return response;
            });
        } catch (err) {
            console.error(err instanceof Error ? err.stack : err);
        }
    }
}