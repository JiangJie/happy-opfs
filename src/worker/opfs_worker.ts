import type { IOResult } from 'happy-rusty';
import type { ReadDirEntry, ReadDirEntrySync } from '../fs/defines.ts';
import { createFile, mkdir, readDir, remove, rename, stat, writeFile } from '../fs/opfs_core.ts';
import { appendFile, copy, emptyDir, exists, readBlobFile, } from '../fs/opfs_ext.ts';
import { deleteTemp, mkTemp, pruneTemp } from '../fs/opfs_tmp.ts';
import { unzip } from '../fs/opfs_unzip.ts';
import { zip } from '../fs/opfs_zip.ts';
import { toFileSystemHandleLike } from '../fs/utils.ts';
import { serializeError, serializeFile } from './helpers.ts';
import { decodeFromBuffer, encodeToBuffer, respondToMainFromWorker, SyncMessenger, WorkerAsyncOp } from './shared.ts';

/**
 * Async I/O operations which allow to call from main thread.
 */
const asyncOps = {
    [WorkerAsyncOp.createFile]: createFile,
    [WorkerAsyncOp.mkdir]: mkdir,
    [WorkerAsyncOp.readDir]: readDir,
    [WorkerAsyncOp.remove]: remove,
    [WorkerAsyncOp.rename]: rename,
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
 * Start worker agent.
 * Listens to postMessage from main thread.
 * Start runner loop.
 */
export function startSyncAgent() {
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
 * Run worker loop.
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