import { Err, Ok, type IOResult } from 'happy-rusty';
import invariant from 'tiny-invariant';
import type { ExistsOptions, FileLike, FileSystemHandleLike, MainMessengerOptions, ReadDirEntrySync, ReadDirOptions, ReadOptions, WriteFileContent, WriteOptions } from '../fs/defines';
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
    if (typeof window === 'undefined') {
        throw new Error('Only can use in main thread');
    }

    if (messenger) {
        throw new Error('Main messenger already started');
    }

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
export function mkdirSync(dirPath: string): IOResult<boolean> {
    return callWorkerOp('mkdir', dirPath);
}

/**
 * Sync version of `readDir`.
 */
export function readDirSync(dirPath: string, options?: ReadDirOptions): IOResult<ReadDirEntrySync[]> {
    return callWorkerOp('readDir', dirPath, options);
}

/**
 * Sync version of `readFile`.
 */
export function readFileSync(filePath: string, options?: ReadOptions): IOResult<ArrayBuffer> {
    const res: IOResult<FileLike> = callWorkerOp('readBlobFile', filePath, options);

    if (res.isErr()) {
        return res.asErr();
    }

    const { data } = res.unwrap();

    return Ok(data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength));
}

/**
 * Sync version of `remove`.
 */
export function removeSync(path: string): IOResult<boolean> {
    return callWorkerOp('remove', path);
}

/**
 * Sync version of `rename`.
 */
export function renameSync(oldPath: string, newPath: string): IOResult<boolean> {
    return callWorkerOp('rename', oldPath, newPath);
}

/**
 * Sync version of `stat`.
 */
export function statSync(path: string): IOResult<FileSystemHandleLike> {
    const res: IOResult<FileSystemHandleLike> = callWorkerOp('stat', path);

    if (res.isErr()) {
        return res.asErr();
    }

    return Ok(res.unwrap());
}

/**
 * Sync version of `writeFile`.
 */
export function writeFileSync(filePath: string, contents: WriteFileContent, options?: WriteOptions): IOResult<boolean> {
    return callWorkerOp('writeFile', filePath, contents, options);
}

/**
 * Sync version of `appendFile`.
 */
export function appendFileSync(filePath: string, contents: WriteFileContent): IOResult<boolean> {
    return callWorkerOp('appendFile', filePath, contents);
}

/**
 * Sync version of `emptyDir`.
 */
export function emptyDirSync(dirPath: string): IOResult<boolean> {
    return callWorkerOp('emptyDir', dirPath);
}

/**
 * Sync version of `exists`.
 */
export function existsSync(path: string, options?: ExistsOptions): IOResult<boolean> {
    return callWorkerOp('exists', path, options);
}

/**
 * Sync version of `readBlobFile`.
 */
export function readBlobFileSync(filePath: string): IOResult<Blob> {
    const res: IOResult<FileLike> = callWorkerOp('readBlobFile', filePath);

    if (res.isErr()) {
        return res.asErr();
    }

    return Ok(deserializeFile(res.unwrap()));
}

/**
 * Sync version of `readTextFile`.
 */
export function readTextFileSync(filePath: string): IOResult<string> {
    const res: IOResult<FileLike> = callWorkerOp('readBlobFile', filePath);

    if (res.isErr()) {
        return res.asErr();
    }

    return Ok(new TextDecoder().decode(res.unwrap().data));
}