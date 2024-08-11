import { Err, Ok, type IOResult, type VoidIOResult } from 'happy-rusty';
import invariant from 'tiny-invariant';
import type { CopyOptions, ExistsOptions, FileLike, FileSystemHandleLike, ReadDirEntrySync, ReadDirOptions, ReadFileContent, ReadOptions, SyncAgentOptions, TempOptions, WriteOptions, WriteSyncFileContent, ZipOptions } from '../fs/defines.ts';
import { deserializeError, setGlobalOpTimeout } from './helpers.ts';
import { callWorkerFromMain, decodeFromBuffer, decodeToString, encodeToBuffer, SyncMessenger, WorkerAsyncOp } from './shared.ts';

/**
 * Cache the messenger instance.
 */
let messenger: SyncMessenger;

/**
 * Communicate with worker.
 * @param options - SyncAgentOptions
 * @returns
 */
export function connectSyncAgent(options: SyncAgentOptions): Promise<void> {
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

        workerAdapter.addEventListener('message', (event: MessageEvent<boolean>) => {
            if (event.data) {
                messenger = new SyncMessenger(sab);

                resolve();
            }
        });

        workerAdapter.postMessage(sab);
    });
}

/**
 * Call worker I/O operation.
 * @param op - I/O operation enum.
 * @param args - I/O operation arguments.
 * @returns - I/O operation result.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function callWorkerOp<T>(op: WorkerAsyncOp, ...args: any[]): IOResult<T> {
    if (!messenger) {
        // too early
        return Err(new Error('Worker not initialized. Come back later.'));
    }

    const request = [op, ...args];
    const requestData = encodeToBuffer(request);

    try {
        const response = callWorkerFromMain(messenger, requestData);

        const decodedResponse = decodeFromBuffer(response) as [Error, T];
        const err = decodedResponse[0];
        const result: IOResult<T> = err ? Err(deserializeError(err)) : Ok((decodedResponse[1] ?? undefined) as T);

        return result;
    } catch (err) {
        return Err(err as Error);
    }
}

/**
 * Sync version of `createFile`.
 */
export function createFileSync(filePath: string): VoidIOResult {
    return callWorkerOp(WorkerAsyncOp.createFile, filePath);
}

/**
 * Sync version of `mkdir`.
 */
export function mkdirSync(dirPath: string): VoidIOResult {
    return callWorkerOp(WorkerAsyncOp.mkdir, dirPath);
}

/**
 * Sync version of `move`.
 */
export function moveSync(oldPath: string, newPath: string): VoidIOResult {
    return callWorkerOp(WorkerAsyncOp.move, oldPath, newPath);
}

/**
 * Sync version of `readDir`.
 */
export function readDirSync(dirPath: string, options?: ReadDirOptions): IOResult<ReadDirEntrySync[]> {
    return callWorkerOp(WorkerAsyncOp.readDir, dirPath, options);
}

/**
 * Sync version of `readFile`.
 */
export function readFileSync(filePath: string, options: ReadOptions & {
    encoding: 'blob';
}): IOResult<FileLike>;
export function readFileSync(filePath: string, options: ReadOptions & {
    encoding: 'utf8';
}): IOResult<string>;
export function readFileSync(filePath: string, options?: ReadOptions & {
    encoding: 'binary';
}): IOResult<ArrayBuffer>;
export function readFileSync<T extends ReadFileContent>(filePath: string, options?: ReadOptions): IOResult<T> {
    const res: IOResult<FileLike> = callWorkerOp(WorkerAsyncOp.readBlobFile, filePath);

    return res.map(file => {
        // actually data is number array
        const u8a = new Uint8Array(file.data);
        file.data = u8a.buffer.slice(u8a.byteOffset, u8a.byteOffset + u8a.byteLength);

        switch (options?.encoding) {
            case 'blob': {
                return file as unknown as T;
            }
            case 'utf8': {
                return decodeToString(new Uint8Array(file.data)) as unknown as T;
            }
            default: {
                return file.data as unknown as T;
            }
        }
    });
}

/**
 * Sync version of `remove`.
 */
export function removeSync(path: string): VoidIOResult {
    return callWorkerOp(WorkerAsyncOp.remove, path);
}

/**
 * Sync version of `stat`.
 */
export function statSync(path: string): IOResult<FileSystemHandleLike> {
    return callWorkerOp(WorkerAsyncOp.stat, path);
}

/**
 * Serialize contents to an byte array or a string that can be sent to worker.
 * @param contents
 * @returns
 */
function serializeWriteContents(contents: WriteSyncFileContent): number[] | string {
    return contents instanceof ArrayBuffer
        ? [...new Uint8Array(contents)]
        : ArrayBuffer.isView(contents)
            ? [...new Uint8Array(contents.buffer)]
            : contents;
}

/**
 * Sync version of `writeFile`.
 */
export function writeFileSync(filePath: string, contents: WriteSyncFileContent, options?: WriteOptions): VoidIOResult {
    return callWorkerOp(WorkerAsyncOp.writeFile, filePath, serializeWriteContents(contents), options);
}

/**
 * Sync version of `appendFile`.
 */
export function appendFileSync(filePath: string, contents: WriteSyncFileContent): VoidIOResult {
    return callWorkerOp(WorkerAsyncOp.appendFile, filePath, serializeWriteContents(contents));
}

/**
 * Sync version of `copy`.
 */
export function copySync(srcPath: string, destPath: string, options?: CopyOptions): VoidIOResult {
    return callWorkerOp(WorkerAsyncOp.copy, srcPath, destPath, options);
}

/**
 * Sync version of `emptyDir`.
 */
export function emptyDirSync(dirPath: string): VoidIOResult {
    return callWorkerOp(WorkerAsyncOp.emptyDir, dirPath);
}

/**
 * Sync version of `exists`.
 */
export function existsSync(path: string, options?: ExistsOptions): IOResult<boolean> {
    return callWorkerOp(WorkerAsyncOp.exists, path, options);
}

/**
 * Sync version of `deleteTemp`.
 */
export function deleteTempSync(): VoidIOResult {
    return callWorkerOp(WorkerAsyncOp.deleteTemp);
}

/**
 * Sync version of `mkTemp`.
 */
export function mkTempSync(options?: TempOptions): IOResult<string> {
    return callWorkerOp(WorkerAsyncOp.mkTemp, options);
}

/**
 * Sync version of `pruneTemp`.
 */
export function pruneTempSync(expired: Date): VoidIOResult {
    return callWorkerOp(WorkerAsyncOp.pruneTemp, expired);
}

/**
 * Sync version of `readBlobFile`.
 */
export function readBlobFileSync(filePath: string): IOResult<FileLike> {
    return readFileSync(filePath, {
        encoding: 'blob',
    });
}

/**
 * Sync version of `readTextFile`.
 */
export function readTextFileSync(filePath: string): IOResult<string> {
    return readFileSync(filePath, {
        encoding: 'utf8',
    });
}

/**
 * Sync version of `unzip`.
 */
export function unzipSync(zipFilePath: string, targetPath: string): VoidIOResult {
    return callWorkerOp(WorkerAsyncOp.unzip, zipFilePath, targetPath);
}

/**
 * Sync version of `zip`.
 */
export function zipSync(sourcePath: string, zipFilePath: string, options?: ZipOptions): VoidIOResult;

/**
 * Sync version of `zip`.
 */
export function zipSync(sourcePath: string, options?: ZipOptions): IOResult<Uint8Array>;

/**
 * Sync version of `zip`.
 */
export function zipSync<T>(sourcePath: string, zipFilePath?: string | ZipOptions, options?: ZipOptions): IOResult<T> {
    const res = callWorkerOp(WorkerAsyncOp.zip, sourcePath, zipFilePath, options) as IOResult<number[]> | VoidIOResult;

    return res.map(data => {
        return (data ? new Uint8Array(data) : data) as T;
    });
}