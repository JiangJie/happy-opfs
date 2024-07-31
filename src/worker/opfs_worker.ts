import type { FileSystemHandleLike, ReadDirEntry, ReadDirEntrySync } from '../fs/defines';
import { mkdir, readDir, remove, rename, stat, writeFile } from '../fs/opfs_core';
import { appendFile, emptyDir, exists, readBlobFile } from '../fs/opfs_ext';
import { serializeError, serializeFile } from './helpers';
import { respondToMainFromWorker, SyncMessenger } from './shared';

/**
 * Async I/O operations which allow to call from main thread.
 */
const asyncOps = {
    mkdir, readDir, remove, rename, stat, writeFile,
    appendFile, emptyDir, exists, readBlobFile,
};

/**
 * Cache the messenger instance.
 */
let messenger: SyncMessenger;

/**
 * Start worker messenger.
 * Listens to postMessage from main thread.
 * Start runner loop.
 */
export function startWorkerMessenger() {
    onmessage = (event: MessageEvent<SharedArrayBuffer>) => {
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
    };
}

/**
 * Run worker loop.
 */
async function runWorkerLoop(): Promise<void> {
    await respondToMainFromWorker(messenger, async (data) => {
        const { encoder, decoder } = messenger;

        const [op, ...args] = decoder.read(data) as [keyof typeof asyncOps, ...Parameters<typeof asyncOps[keyof typeof asyncOps]>];
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

            if (op === 'readBlobFile') {
                const file: File = res.unwrap();

                rawResponse = await serializeFile(file);
            } else if (op === 'readDir') {
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
            } else if (op === 'stat') {
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

    // loop forever
    runWorkerLoop();
}