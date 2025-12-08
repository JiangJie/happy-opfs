import type { IOResult } from 'happy-rusty';
import type { ReadDirEntry, ReadDirEntrySync } from '../fs/defines.ts';
import { createFile, mkdir, readDir, remove, stat, writeFile } from '../fs/opfs_core.ts';
import { appendFile, copy, emptyDir, exists, move, readBlobFile, } from '../fs/opfs_ext.ts';
import { deleteTemp, mkTemp, pruneTemp } from '../fs/opfs_tmp.ts';
import { unzip } from '../fs/opfs_unzip.ts';
import { zip } from '../fs/opfs_zip.ts';
import { toFileSystemHandleLike } from '../fs/utils.ts';
import { serializeError, serializeFile } from './helpers.ts';
import { DATA_INDEX, decodeFromBuffer, encodeToBuffer, MAIN_LOCK_INDEX, MAIN_UNLOCKED, SyncMessenger, WORKER_LOCK_INDEX, WORKER_UNLOCKED, WorkerAsyncOp } from './shared.ts';

/**
 * Worker thread locked value.
 * Default.
 */
const WORKER_LOCKED = MAIN_UNLOCKED;

/**
 * Mapping of async operation enums to their corresponding functions.
 * @internal
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

/**
 * Main loop that continuously processes requests from the main thread.
 * Runs indefinitely until the worker is terminated.
 * @internal
 */
async function runWorkerLoop(): Promise<void> {
    // loop forever
    while (true) {
        try {
            await respondToMainFromWorker(messenger, async (data) => {
                const [op, ...args] = decodeFromBuffer(data) as [WorkerAsyncOp, ...Parameters<typeof asyncOps[WorkerAsyncOp]>];

                // handling unequal parameters for serialization and deserialization
                if (op === WorkerAsyncOp.writeFile || op === WorkerAsyncOp.appendFile) {
                    // actually is an byte array
                    if (Array.isArray(args[1])) {
                        args[1] = new Uint8Array(args[1]);
                    }
                } else if (op === WorkerAsyncOp.pruneTemp) {
                    // actually is a Date string
                    args[0] = new Date(args[0] as Date);
                }

                let response: Uint8Array;

                const handle = asyncOps[op];

                try {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const res: IOResult<any> = await (handle as any)(...args);

                    if (res.isErr()) {
                        // without result success
                        response = encodeToBuffer([serializeError(res.unwrapErr())]);
                    } else {
                        // manually serialize response
                        let rawResponse;

                        if (op === WorkerAsyncOp.readBlobFile) {
                            const file: File = res.unwrap();

                            const fileLike = await serializeFile(file);

                            rawResponse = {
                                ...fileLike,
                                // for serialize
                                data: [...new Uint8Array(fileLike.data)],
                            };
                        } else if (op === WorkerAsyncOp.readDir) {
                            const iterator: AsyncIterableIterator<ReadDirEntry> = res.unwrap();
                            const entries: ReadDirEntrySync[] = [];

                            for await (const { path, handle } of iterator) {
                                const handleLike = await toFileSystemHandleLike(handle);
                                entries.push({
                                    path,
                                    handle: handleLike,
                                });
                            }

                            rawResponse = entries;
                        } else if (op === WorkerAsyncOp.stat) {
                            const handle: FileSystemHandle = res.unwrap();
                            const data = await toFileSystemHandleLike(handle);

                            rawResponse = data;
                        } else if (op === WorkerAsyncOp.zip) {
                            const data: Uint8Array | undefined = res.unwrap();

                            rawResponse = data instanceof Uint8Array ? [...data] : data;
                        } else {
                            // others are all boolean
                            rawResponse = res.unwrap();
                        }

                        // without error
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