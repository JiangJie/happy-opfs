import type { FileSystemHandleLike, ReadDirEntry, ReadDirEntrySync } from '../fs/defines';
import { mkdir, readDir, remove, rename, stat, writeFile } from '../fs/opfs_core';
import { appendFile, emptyDir, exists, readBlobFile } from '../fs/opfs_ext';
import { serializeError, serializeFile } from './helpers';
import { respondToMainFromWorker, SyncMessenger, WorkerAsyncOp } from './shared';

/**
 * Async I/O operations which allow to call from main thread.
 */
const asyncOps = {
    [WorkerAsyncOp.mkdir]: mkdir,
    [WorkerAsyncOp.readDir]: readDir,
    [WorkerAsyncOp.remove]: remove,
    [WorkerAsyncOp.rename]: rename,
    [WorkerAsyncOp.stat]: stat,
    [WorkerAsyncOp.writeFile]: writeFile,
    [WorkerAsyncOp.appendFile]: appendFile,
    [WorkerAsyncOp.emptyDir]: emptyDir,
    [WorkerAsyncOp.exists]: exists,
    [WorkerAsyncOp.readBlobFile]: readBlobFile,
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
                const { encoder, decoder } = messenger;

                const [op, ...args] = decoder.read(data) as [WorkerAsyncOp, ...Parameters<typeof asyncOps[WorkerAsyncOp]>];
                const handle = asyncOps[op];
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const res = await (handle as any)(...args);

                let response: Uint8Array;

                if (res.isErr()) {
                    // without result success
                    response = encoder.encode([serializeError(res.unwrapErr())]);
                } else {
                    // manually serialize response
                    let rawResponse;

                    if (op === WorkerAsyncOp.readBlobFile) {
                        const file: File = res.unwrap();

                        rawResponse = await serializeFile(file);
                    } else if (op === WorkerAsyncOp.readDir) {
                        const iterator: AsyncIterableIterator<ReadDirEntry> = res.unwrap();
                        const entries: ReadDirEntrySync[] = [];

                        for await (const entry of iterator) {
                            entries.push({
                                path: entry.path,
                                handle: {
                                    name: entry.handle.name,
                                    kind: entry.handle.kind,
                                },
                            });
                        }

                        rawResponse = entries;
                    } else if (op === WorkerAsyncOp.stat) {
                        const data: FileSystemHandle = res.unwrap();

                        const handle: FileSystemHandleLike = {
                            name: data.name,
                            kind: data.kind,
                        };

                        rawResponse = handle;
                    } else {
                        // others are all boolean
                        const data: boolean = res.unwrap();

                        rawResponse = data;
                    }

                    // without error
                    response = encoder.encode([null, rawResponse]);
                }

                return response;
            });
        } catch (err) {
            console.error(err instanceof Error ? err.stack : err);
        }
    }
}