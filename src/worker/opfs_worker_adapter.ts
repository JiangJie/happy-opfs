import { Err, Ok, type IOResult } from 'happy-rusty';
import invariant from 'tiny-invariant';
import type { FileLike, FileSystemHandleLike, MainMessengerOptions, ReadDirEntrySync } from '../fs/defines';
import type { mkdir, readDir, readFile, remove, rename, stat, writeFile } from '../fs/opfs_core';
import type { appendFile, emptyDir, exists, readBlobFile, readTextFile } from '../fs/opfs_ext';
import { deserializeError, deserializeFile, setGlobalOpTimeout } from './helpers';
import { callWorkerFromMain, SyncMessenger } from './shared';

/**
 * Cache the messenger instance.
 */
let messenger: SyncMessenger;

/**
 * Start main messenger to communicate with worker.
 * @param options - MainMessengerOptions
 * @returns
 */
export function startMainMessenger(options: MainMessengerOptions): Promise<void> {
    return new Promise(resolve => {
        const {
            worker,
            bufferLength = 1024 * 1024,
            opTimeout = 1000,
        } = options;

        // check parameters
        invariant(worker instanceof Worker || worker instanceof URL || (typeof worker === 'string' && worker), () => 'worker must be Worker or valid URL(string)');
        invariant(bufferLength > 16 && bufferLength % 4 === 0, () => 'bufferLength must be a multiple of 4')
        invariant(Number.isInteger(opTimeout) && opTimeout > 0, () => 'opTimeout must be integer and greater than 0');

        setGlobalOpTimeout(opTimeout);

        const workerAdapter = worker instanceof Worker
            ? worker
            : new Worker(worker);

        const sab = new SharedArrayBuffer(bufferLength);

        workerAdapter.postMessage(sab);

        workerAdapter.onmessage = (event: MessageEvent<boolean>) => {
            if (event.data) {
                messenger = new SyncMessenger(sab);

                resolve();
            }
        };
    });
}

/**
 * Call worker I/O operation.
 * @param op - I/O operation name.
 * @param args - I/O operation arguments.
 * @returns - I/O operation result.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function callWorkerOp<T>(op: string, ...args: any[]): IOResult<T> {
    if (!messenger) {
        // too early
        return Err(new Error('Worker not initialized. Come back later.'));
    }

    const { encoder, decoder } = messenger;

    const request = [op, ...args];
    const requestData = encoder.encode(request);

    try {
        const response = callWorkerFromMain(messenger, requestData);

        const decodedResponse = decoder.read(response) as [Error, T];
        const result: IOResult<T> = decodedResponse[0] ? Err(deserializeError(decodedResponse[0])) : Ok(decodedResponse[1]);

        return result;
    } catch (error: unknown) {
        return Err(error as Error);
    }
}

/**
 * Sync version of `mkdir`.
 */
export function mkdirSync(...args: Parameters<typeof mkdir>): IOResult<boolean> {
    return callWorkerOp('mkdir', ...args);
}

/**
 * Sync version of `readDir`.
 */
export function readDirSync(...args: Parameters<typeof readDir>): IOResult<ReadDirEntrySync[]> {
    return callWorkerOp('readDir', ...args);
}

/**
 * Sync version of `readFile`.
 */
export function readFileSync(...args: Parameters<typeof readFile>): IOResult<ArrayBuffer> {
    const res: IOResult<FileLike> = callWorkerOp('readBlobFile', ...args);

    if (res.isErr()) {
        return res.asErr();
    }

    const { data } = res.unwrap();

    return Ok(data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength));
}

/**
 * Sync version of `remove`.
 */
export function removeSync(...args: Parameters<typeof remove>): IOResult<boolean> {
    return callWorkerOp('remove', ...args);
}

/**
 * Sync version of `rename`.
 */
export function renameSync(...args: Parameters<typeof rename>): IOResult<boolean> {
    return callWorkerOp('rename', ...args);
}

/**
 * Sync version of `stat`.
 */
export function statSync(...args: Parameters<typeof stat>): IOResult<FileSystemHandleLike> {
    const res: IOResult<FileSystemHandleLike> = callWorkerOp('stat', ...args);

    if (res.isErr()) {
        return res.asErr();
    }

    return Ok(res.unwrap());
}

/**
 * Sync version of `writeFile`.
 */
export function writeFileSync(...args: Parameters<typeof writeFile>): IOResult<boolean> {
    return callWorkerOp('writeFile', ...args);
}

/**
 * Sync version of `appendFile`.
 */
export function appendFileSync(...args: Parameters<typeof appendFile>): IOResult<boolean> {
    return callWorkerOp('appendFile', ...args);
}

/**
 * Sync version of `emptyDir`.
 */
export function emptyDirSync(...args: Parameters<typeof emptyDir>): IOResult<boolean> {
    return callWorkerOp('emptyDir', ...args);
}

/**
 * Sync version of `exists`.
 */
export function existsSync(...args: Parameters<typeof exists>): IOResult<boolean> {
    return callWorkerOp('exists', ...args);
}

/**
 * Sync version of `readBlobFile`.
 */
export function readBlobFileSync(...args: Parameters<typeof readBlobFile>): IOResult<Blob> {
    const res: IOResult<FileLike> = callWorkerOp('readBlobFile', ...args);

    if (res.isErr()) {
        return res.asErr();
    }

    return Ok(deserializeFile(res.unwrap()));
}

/**
 * Sync version of `readTextFile`.
 */
export function readTextFileSync(...args: Parameters<typeof readTextFile>): IOResult<string> {
    const res: IOResult<FileLike> = callWorkerOp('readBlobFile', ...args);

    if (res.isErr()) {
        return res.asErr();
    }

    return Ok(new TextDecoder().decode(res.unwrap().data));
}