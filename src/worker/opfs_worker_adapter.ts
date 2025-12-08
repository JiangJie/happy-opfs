import { Err, Ok, type IOResult, type VoidIOResult } from 'happy-rusty';
import { Future } from 'tiny-future';
import invariant from 'tiny-invariant';
import { textDecode } from '../fs/codec.ts';
import type { CopyOptions, ExistsOptions, FileLike, FileSystemHandleLike, MoveOptions, ReadDirEntrySync, ReadDirOptions, ReadFileContent, ReadOptions, SyncAgentOptions, TempOptions, WriteOptions, WriteSyncFileContent, ZipOptions } from '../fs/defines.ts';
import { deserializeError, setGlobalOpTimeout, sleepUntil } from './helpers.ts';
import { DATA_INDEX, decodeFromBuffer, encodeToBuffer, MAIN_LOCK_INDEX, MAIN_LOCKED, MAIN_UNLOCKED, SyncMessenger, WORKER_LOCK_INDEX, WORKER_UNLOCKED, WorkerAsyncOp } from './shared.ts';

/**
 * Cache the messenger instance.
 */
let messenger: SyncMessenger;

/**
 * Connects to a sync agent worker for synchronous file system operations.
 * Must be called before using any sync API functions.
 *
 * @param options - Configuration options for the sync agent.
 * @returns A promise that resolves when the worker is ready.
 * @throws {Error} If called outside the main thread or if already connected.
 * @example
 * ```typescript
 * await connectSyncAgent({
 *     worker: new URL('./worker.js', import.meta.url),
 *     bufferLength: 1024 * 1024,
 *     opTimeout: 5000,
 * });
 * ```
 */
export function connectSyncAgent(options: SyncAgentOptions): Promise<void> {
    if (typeof window === 'undefined') {
        throw new Error('Only can use in main thread');
    }

    if (messenger) {
        throw new Error('Main messenger already started');
    }

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

    const sab = new SharedArrayBuffer(bufferLength);

    const future = new Future<void>();

    const workerAdapter = worker instanceof Worker
        ? worker
        : new Worker(worker);
    workerAdapter.addEventListener('message', (event: MessageEvent<boolean>) => {
        if (event.data) {
            messenger = new SyncMessenger(sab);

            future.resolve();
        }
    });
    workerAdapter.postMessage(sab);

    return future.promise;
}

/**
 * Gets the current sync messenger instance.
 * Can be used to share the messenger with other environments.
 *
 * @returns The `SyncMessenger` instance, or `undefined` if not connected.
 * @example
 * ```typescript
 * const messenger = getSyncMessenger();
 * // Pass to another context
 * otherContext.setSyncMessenger(messenger);
 * ```
 */
export function getSyncMessenger(): SyncMessenger {
    return messenger;
}

/**
 * Sets the sync messenger instance.
 * Used to share a messenger from another environment.
 *
 * @param syncMessenger - The `SyncMessenger` instance to use.
 * @throws {Error} If syncMessenger is null or undefined.
 * @example
 * ```typescript
 * // Receive messenger from main context
 * setSyncMessenger(receivedMessenger);
 * // Now sync APIs can be used
 * ```
 */
export function setSyncMessenger(syncMessenger: SyncMessenger): void {
    invariant(syncMessenger != null, () => 'syncMessenger is null or undefined');
    messenger = syncMessenger;
}

/**
 * Sends a synchronous request from main thread to worker and waits for response.
 * This function blocks the main thread until the worker responds.
 *
 * @param messenger - The `SyncMessenger` instance for communication.
 * @param data - The request data as a `Uint8Array`.
 * @returns The response data as a `Uint8Array`.
 * @throws {RangeError} If the request data exceeds the buffer's maximum capacity.
 */
function callWorkerFromMain(messenger: SyncMessenger, data: Uint8Array): Uint8Array {
    const { i32a, u8a, headerLength, maxDataLength } = messenger;
    const requestLength = data.byteLength;

    // check whether request is too large
    if (requestLength > maxDataLength) {
        throw new RangeError(`Request is too large: ${ requestLength } > ${ maxDataLength }. Consider grow the size of SharedArrayBuffer.`);
    }

    // lock main thread
    Atomics.store(i32a, MAIN_LOCK_INDEX, MAIN_LOCKED);

    // payload and length
    i32a[DATA_INDEX] = requestLength;
    u8a.set(data, headerLength);

    // wakeup worker
    // Atomics.notify(i32a, WORKER_LOCK_INDEX); // this may not work
    Atomics.store(i32a, WORKER_LOCK_INDEX, WORKER_UNLOCKED);

    // wait for worker to finish
    sleepUntil(() => Atomics.load(i32a, MAIN_LOCK_INDEX) === MAIN_UNLOCKED);

    // worker return
    const responseLength = i32a[DATA_INDEX];
    const response = u8a.slice(headerLength, headerLength + responseLength);

    return response;
}

/**
 * Calls a worker I/O operation synchronously.
 *
 * @template T - The expected return type.
 * @param op - The I/O operation enum value.
 * @param args - Arguments to pass to the operation.
 * @returns The I/O operation result.
 * @internal
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
 * Synchronous version of `createFile`.
 * Creates a new empty file at the specified path.
 *
 * @param filePath - The absolute path of the file to create.
 * @returns A `VoidIOResult` indicating success or failure.
 * @see {@link createFile} for the async version.
 */
export function createFileSync(filePath: string): VoidIOResult {
    return callWorkerOp(WorkerAsyncOp.createFile, filePath);
}

/**
 * Synchronous version of `mkdir`.
 * Creates a directory at the specified path, including any necessary parent directories.
 *
 * @param dirPath - The absolute path of the directory to create.
 * @returns A `VoidIOResult` indicating success or failure.
 * @see {@link mkdir} for the async version.
 */
export function mkdirSync(dirPath: string): VoidIOResult {
    return callWorkerOp(WorkerAsyncOp.mkdir, dirPath);
}

/**
 * Synchronous version of `move`.
 * Moves a file or directory from one location to another.
 *
 * @param srcPath - The source path.
 * @param destPath - The destination path.
 * @param options - Optional move options.
 * @returns A `VoidIOResult` indicating success or failure.
 * @see {@link move} for the async version.
 */
export function moveSync(srcPath: string, destPath: string, options?: MoveOptions): VoidIOResult {
    return callWorkerOp(WorkerAsyncOp.move, srcPath, destPath, options);
}

/**
 * Synchronous version of `readDir`.
 * Reads the contents of a directory.
 *
 * @param dirPath - The absolute path of the directory to read.
 * @param options - Optional read options (e.g., recursive).
 * @returns An `IOResult` containing an array of directory entries.
 * @see {@link readDir} for the async version.
 */
export function readDirSync(dirPath: string, options?: ReadDirOptions): IOResult<ReadDirEntrySync[]> {
    return callWorkerOp(WorkerAsyncOp.readDir, dirPath, options);
}

/**
 * Synchronous version of `readFile`.
 * Reads the content of a file as a `FileLike` object (blob encoding).
 *
 * @param filePath - The absolute path of the file to read.
 * @param options - Read options with 'blob' encoding.
 * @returns An `IOResult` containing a `FileLike` object.
 */
export function readFileSync(filePath: string, options: ReadOptions & {
    encoding: 'blob';
}): IOResult<FileLike>;
/**
 * Synchronous version of `readFile`.
 * Reads the content of a file as a string (utf8 encoding).
 *
 * @param filePath - The absolute path of the file to read.
 * @param options - Read options with 'utf8' encoding.
 * @returns An `IOResult` containing the file content as a string.
 */
export function readFileSync(filePath: string, options: ReadOptions & {
    encoding: 'utf8';
}): IOResult<string>;
/**
 * Synchronous version of `readFile`.
 * Reads the content of a file as an ArrayBuffer (binary/default encoding).
 *
 * @param filePath - The absolute path of the file to read.
 * @param options - Optional read options with 'binary' encoding.
 * @returns An `IOResult` containing the file content as an ArrayBuffer.
 */
export function readFileSync(filePath: string, options?: ReadOptions & {
    encoding: 'binary';
}): IOResult<ArrayBuffer>;
/**
 * Synchronous version of `readFile`.
 * Reads the content of a file with the specified encoding.
 *
 * @template T - The expected content type based on encoding.
 * @param filePath - The absolute path of the file to read.
 * @param options - Optional read options.
 * @returns An `IOResult` containing the file content.
 * @see {@link readFile} for the async version.
 */
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
                return textDecode(new Uint8Array(file.data)) as unknown as T;
            }
            default: {
                return file.data as unknown as T;
            }
        }
    });
}

/**
 * Synchronous version of `remove`.
 * Removes a file or directory at the specified path.
 *
 * @param path - The absolute path of the file or directory to remove.
 * @returns A `VoidIOResult` indicating success or failure.
 * @see {@link remove} for the async version.
 */
export function removeSync(path: string): VoidIOResult {
    return callWorkerOp(WorkerAsyncOp.remove, path);
}

/**
 * Synchronous version of `stat`.
 * Retrieves metadata about a file or directory.
 *
 * @param path - The absolute path to get status for.
 * @returns An `IOResult` containing a `FileSystemHandleLike` object.
 * @see {@link stat} for the async version.
 */
export function statSync(path: string): IOResult<FileSystemHandleLike> {
    return callWorkerOp(WorkerAsyncOp.stat, path);
}

/**
 * Serializes write contents to a format that can be sent to the worker.
 * Converts `ArrayBuffer` and `TypedArray` to a number array, keeps strings as-is.
 *
 * @param contents - The content to serialize (ArrayBuffer, TypedArray, or string).
 * @returns A number array for binary data, or the original string.
 * @internal
 */
function serializeWriteContents(contents: WriteSyncFileContent): number[] | string {
    if (contents instanceof ArrayBuffer) {
        return [...new Uint8Array(contents)];
    }
    if (ArrayBuffer.isView(contents)) {
        // Handle TypedArrays with potential byteOffset
        return [...new Uint8Array(contents.buffer, contents.byteOffset, contents.byteLength)];
    }
    return contents;
}

/**
 * Synchronous version of `writeFile`.
 * Writes content to a file at the specified path.
 *
 * @param filePath - The absolute path of the file to write.
 * @param contents - The content to write (ArrayBuffer, TypedArray, or string).
 * @param options - Optional write options.
 * @returns A `VoidIOResult` indicating success or failure.
 * @see {@link writeFile} for the async version.
 */
export function writeFileSync(filePath: string, contents: WriteSyncFileContent, options?: WriteOptions): VoidIOResult {
    return callWorkerOp(WorkerAsyncOp.writeFile, filePath, serializeWriteContents(contents), options);
}

/**
 * Synchronous version of `appendFile`.
 * Appends content to a file at the specified path.
 *
 * @param filePath - The absolute path of the file to append to.
 * @param contents - The content to append (ArrayBuffer, TypedArray, or string).
 * @returns A `VoidIOResult` indicating success or failure.
 * @see {@link appendFile} for the async version.
 */
export function appendFileSync(filePath: string, contents: WriteSyncFileContent): VoidIOResult {
    return callWorkerOp(WorkerAsyncOp.appendFile, filePath, serializeWriteContents(contents));
}

/**
 * Synchronous version of `copy`.
 * Copies a file or directory from one location to another.
 *
 * @param srcPath - The source path.
 * @param destPath - The destination path.
 * @param options - Optional copy options.
 * @returns A `VoidIOResult` indicating success or failure.
 * @see {@link copy} for the async version.
 */
export function copySync(srcPath: string, destPath: string, options?: CopyOptions): VoidIOResult {
    return callWorkerOp(WorkerAsyncOp.copy, srcPath, destPath, options);
}

/**
 * Synchronous version of `emptyDir`.
 * Removes all contents of a directory.
 *
 * @param dirPath - The absolute path of the directory to empty.
 * @returns A `VoidIOResult` indicating success or failure.
 * @see {@link emptyDir} for the async version.
 */
export function emptyDirSync(dirPath: string): VoidIOResult {
    return callWorkerOp(WorkerAsyncOp.emptyDir, dirPath);
}

/**
 * Synchronous version of `exists`.
 * Checks whether a file or directory exists at the specified path.
 *
 * @param path - The absolute path to check.
 * @param options - Optional existence options (e.g., isDirectory, isFile).
 * @returns An `IOResult` containing `true` if exists, `false` otherwise.
 * @see {@link exists} for the async version.
 */
export function existsSync(path: string, options?: ExistsOptions): IOResult<boolean> {
    return callWorkerOp(WorkerAsyncOp.exists, path, options);
}

/**
 * Synchronous version of `deleteTemp`.
 * Deletes the temporary directory and all its contents.
 *
 * @returns A `VoidIOResult` indicating success or failure.
 * @see {@link deleteTemp} for the async version.
 */
export function deleteTempSync(): VoidIOResult {
    return callWorkerOp(WorkerAsyncOp.deleteTemp);
}

/**
 * Synchronous version of `mkTemp`.
 * Creates a temporary file or directory.
 *
 * @param options - Optional temp options (e.g., isDirectory, basename, extname).
 * @returns An `IOResult` containing the temporary path.
 * @see {@link mkTemp} for the async version.
 */
export function mkTempSync(options?: TempOptions): IOResult<string> {
    return callWorkerOp(WorkerAsyncOp.mkTemp, options);
}

/**
 * Synchronous version of `pruneTemp`.
 * Removes expired files from the temporary directory.
 *
 * @param expired - Files with lastModified before this date will be removed.
 * @returns A `VoidIOResult` indicating success or failure.
 * @see {@link pruneTemp} for the async version.
 */
export function pruneTempSync(expired: Date): VoidIOResult {
    return callWorkerOp(WorkerAsyncOp.pruneTemp, expired);
}

/**
 * Synchronous version of `readBlobFile`.
 * Reads a file as a `FileLike` object.
 *
 * @param filePath - The absolute path of the file to read.
 * @returns An `IOResult` containing a `FileLike` object.
 * @see {@link readBlobFile} for the async version.
 */
export function readBlobFileSync(filePath: string): IOResult<FileLike> {
    return readFileSync(filePath, {
        encoding: 'blob',
    });
}

/**
 * Synchronous version of `readJsonFile`.
 * Reads and parses a JSON file.
 *
 * @template T - The expected type of the parsed JSON.
 * @param filePath - The absolute path of the JSON file to read.
 * @returns An `IOResult` containing the parsed JSON object.
 * @see {@link readJsonFile} for the async version.
 */
export function readJsonFileSync<T>(filePath: string): IOResult<T> {
    return readTextFileSync(filePath).andThen(contents => {
        try {
            return Ok(JSON.parse(contents));
        } catch (e) {
            return Err(e as Error);
        }
    });
}

/**
 * Synchronous version of `readTextFile`.
 * Reads a file as a UTF-8 string.
 *
 * @param filePath - The absolute path of the file to read.
 * @returns An `IOResult` containing the file content as a string.
 * @see {@link readTextFile} for the async version.
 */
export function readTextFileSync(filePath: string): IOResult<string> {
    return readFileSync(filePath, {
        encoding: 'utf8',
    });
}

/**
 * Synchronous version of `writeJsonFile`.
 * Writes an object to a file as JSON.
 *
 * @template T - The type of the object to write.
 * @param filePath - The absolute path of the file to write.
 * @param data - The object to serialize and write.
 * @returns A `VoidIOResult` indicating success or failure.
 * @see {@link writeJsonFile} for the async version.
 */
export function writeJsonFileSync<T>(filePath: string, data: T): VoidIOResult {
    try {
        const contents = JSON.stringify(data);
        return writeFileSync(filePath, contents);
    } catch (e) {
        return Err(e as Error);
    }
}

/**
 * Synchronous version of `unzip`.
 * Extracts a zip file to a directory.
 *
 * @param zipFilePath - The path to the zip file.
 * @param targetPath - The directory to extract to.
 * @returns A `VoidIOResult` indicating success or failure.
 * @see {@link unzip} for the async version.
 */
export function unzipSync(zipFilePath: string, targetPath: string): VoidIOResult {
    return callWorkerOp(WorkerAsyncOp.unzip, zipFilePath, targetPath);
}

/**
 * Synchronous version of `zip`.
 * Zips a file or directory and writes to a zip file.
 *
 * @param sourcePath - The path to zip.
 * @param zipFilePath - The destination zip file path.
 * @param options - Optional zip options.
 * @returns A `VoidIOResult` indicating success or failure.
 */
export function zipSync(sourcePath: string, zipFilePath: string, options?: ZipOptions): VoidIOResult;
/**
 * Synchronous version of `zip`.
 * Zips a file or directory and returns the zip data.
 *
 * @param sourcePath - The path to zip.
 * @param options - Optional zip options.
 * @returns An `IOResult` containing the zip data as `Uint8Array`.
 */
export function zipSync(sourcePath: string, options?: ZipOptions): IOResult<Uint8Array>;
/**
 * Synchronous version of `zip`.
 * Zips a file or directory.
 *
 * @template T - The return type (void when writing to file, Uint8Array when returning data).
 * @param sourcePath - The path to zip.
 * @param zipFilePath - Optional destination zip file path or options.
 * @param options - Optional zip options.
 * @returns An `IOResult` containing the result.
 * @see {@link zip} for the async version.
 */
export function zipSync<T>(sourcePath: string, zipFilePath?: string | ZipOptions, options?: ZipOptions): IOResult<T> {
    const res = callWorkerOp(WorkerAsyncOp.zip, sourcePath, zipFilePath, options) as IOResult<number[]> | VoidIOResult;

    return res.map(data => {
        return (data ? new Uint8Array(data) : data) as T;
    });
}