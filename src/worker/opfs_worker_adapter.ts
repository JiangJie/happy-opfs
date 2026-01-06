import { Err, Ok, Once, tryResult, type IOResult, type Option, type VoidIOResult } from 'happy-rusty';
import { Future } from 'tiny-future';
import invariant from 'tiny-invariant';
import { textDecode } from '../fs/codec.ts';
import { TIMEOUT_ERROR } from '../fs/constants.ts';
import type { CopyOptions, DirEntryLike, ExistsOptions, FileSystemHandleLike, MoveOptions, ReadDirOptions, ReadFileContent, ReadOptions, SyncAgentOptions, TempOptions, WriteOptions, WriteSyncFileContent, ZipOptions } from '../fs/defines.ts';
import type { ErrorLike, FileLike } from './defines.ts';
import { DATA_INDEX, decodeFromBuffer, encodeToBuffer, MAIN_LOCK_INDEX, MAIN_LOCKED, MAIN_UNLOCKED, SyncMessenger, WORKER_LOCK_INDEX, WORKER_UNLOCKED, WorkerAsyncOp } from './shared.ts';

/**
 * Deserializes an `ErrorLike` object back to an `Error` instance.
 *
 * @param error - The `ErrorLike` object to deserialize.
 * @returns An `Error` instance with the same name and message.
 */
function deserializeError(error: ErrorLike): Error {
    const err = new Error(error.message);
    err.name = error.name;

    return err;
}

/**
 * Deserializes a `FileLike` object back to a `File` instance.
 *
 * @param file - The `FileLike` object to deserialize.
 * @returns A `File` instance with the same properties.
 */
function deserializeFile(file: FileLike): File {
    const blob = new Blob([new Uint8Array(file.data)]);

    return new File([blob], file.name, {
        type: file.type,
        lastModified: file.lastModified,
    });
}

/**
 * Once-initialized messenger instance.
 * Can only be set once via `connectSyncAgent` or `setSyncMessenger`.
 */
const messengerOnce = Once<SyncMessenger>();

/**
 * Global timeout for synchronous I/O operations in milliseconds.
 */
let globalSyncOpTimeout = 1000;

/**
 * Blocks execution until a condition is met or timeout occurs.
 * Uses busy-waiting, which is necessary for synchronous operations.
 *
 * @param condition - A function that returns `true` when the wait should end.
 * @returns A `VoidIOResult` - `Ok` if condition met, `Err` with TimeoutError if timed out.
 */
function sleepUntil(condition: () => boolean): VoidIOResult {
    const start = performance.now();
    while (!condition()) {
        if (performance.now() - start > globalSyncOpTimeout) {
            const error = new Error('Operation timed out');
            error.name = TIMEOUT_ERROR;

            return Err(error);
        }
    }

    return Ok();
}

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

    if (isSyncAgentConnected()) {
        throw new Error('Main messenger already connected');
    }

    const {
        worker,
        bufferLength = 1024 * 1024,
        opTimeout = 1000,
    } = options;

    // check parameters
    invariant(worker instanceof Worker || worker instanceof URL || (typeof worker === 'string' && worker), () => 'worker must be Worker or valid URL(string)');
    // Minimum buffer size: 16 bytes header + ~131 bytes for largest error response = 147 bytes
    // Using 256 (power of 2) for better memory alignment
    invariant(bufferLength >= 256 && bufferLength % 4 === 0, () => 'bufferLength must be at least 256 and a multiple of 4');
    invariant(Number.isInteger(opTimeout) && opTimeout > 0, () => 'opTimeout must be integer and greater than 0');

    globalSyncOpTimeout = opTimeout;

    const sab = new SharedArrayBuffer(bufferLength);

    const future = new Future<void>();

    const workerAdapter = worker instanceof Worker
        ? worker
        : new Worker(worker);
    workerAdapter.addEventListener('message', (event: MessageEvent<boolean>) => {
        if (event.data) {
            messengerOnce.set(new SyncMessenger(sab));

            future.resolve();
        }
    });
    workerAdapter.postMessage(sab);

    return future.promise;
}

/**
 * Checks if the sync agent is already connected.
 *
 * @returns `true` if connected, `false` otherwise.
 * @example
 * ```typescript
 * if (!isSyncAgentConnected()) {
 *     await connectSyncAgent({ worker: new URL('./worker.js', import.meta.url) });
 * }
 * ```
 */
export function isSyncAgentConnected(): boolean {
    return messengerOnce.isInitialized();
}

/**
 * Gets the current sync messenger instance.
 * Can be used to share the messenger with other contexts (e.g., iframes).
 *
 * This is useful when you have multiple contexts that need to use sync APIs
 * but only want to create one worker connection.
 *
 * @returns An `Option<SyncMessenger>` - `Some(messenger)` if connected, `None` otherwise.
 * @example
 * ```typescript
 * // In main page: connect and share messenger to iframe
 * await connectSyncAgent({ worker: new URL('./worker.js', import.meta.url) });
 * getSyncMessenger()
 *     .inspect(messenger => {
 *         iframe.contentWindow.postMessage({ type: 'sync-messenger', messenger }, '*');
 *     });
 * ```
 */
export function getSyncMessenger(): Option<SyncMessenger> {
    return messengerOnce.get();
}

/**
 * Sets the sync messenger instance.
 * Used to receive a shared messenger from another context.
 *
 * After calling this function, sync APIs (e.g., `readFileSync`, `writeFileSync`)
 * can be used in the current context without calling `connectSyncAgent`.
 *
 * @param syncMessenger - The `SyncMessenger` instance to use.
 * @throws {Error} If syncMessenger is null or undefined.
 * @example
 * ```typescript
 * // In iframe: receive messenger from main page
 * window.addEventListener('message', (event) => {
 *     if (event.data.type === 'sync-messenger') {
 *         setSyncMessenger(event.data.messenger);
 *         // Now sync APIs can be used
 *         const result = readTextFileSync('/data/file.txt');
 *     }
 * });
 * ```
 */
export function setSyncMessenger(syncMessenger: SyncMessenger): void {
    invariant(syncMessenger != null, () => 'syncMessenger is null or undefined');
    messengerOnce.set(syncMessenger);
}

/**
 * Sends a synchronous request from main thread to worker and waits for response.
 * This function blocks the main thread until the worker responds.
 *
 * Communication Protocol:
 * 1. Lock main thread (set MAIN_LOCKED) to signal we're waiting
 * 2. Write request data and length to SharedArrayBuffer
 * 3. Wake worker by setting WORKER_UNLOCKED
 * 4. Busy-wait until worker signals completion (MAIN_UNLOCKED)
 * 5. Read response from SharedArrayBuffer
 *
 * @param messenger - The `SyncMessenger` instance for communication.
 * @param data - The request data as a `Uint8Array`.
 * @returns An `IOResult` containing the response data, or an error if the request is too large or times out.
 */
function callWorkerFromMain(messenger: SyncMessenger, data: Uint8Array): IOResult<Uint8Array> {
    const { i32a, maxDataLength } = messenger;
    const requestLength = data.byteLength;

    // check whether request is too large
    if (requestLength > maxDataLength) {
        return Err(new RangeError(`Request is too large: ${ requestLength } > ${ maxDataLength }. Consider increasing the size of SharedArrayBuffer`));
    }

    // Lock main thread - signal that we're waiting for a response
    Atomics.store(i32a, MAIN_LOCK_INDEX, MAIN_LOCKED);

    // Write payload: store length and data to SharedArrayBuffer
    i32a[DATA_INDEX] = requestLength;
    messenger.setPayload(data);

    // Wake up worker by setting it to UNLOCKED
    // Note: Atomics.notify() may not work reliably cross-thread, using store + busy-wait instead
    // Atomics.notify(i32a, WORKER_LOCK_INDEX); // this may not work
    Atomics.store(i32a, WORKER_LOCK_INDEX, WORKER_UNLOCKED);

    // Busy-wait for worker to finish processing and unlock main thread
    const waitResult = sleepUntil(() => Atomics.load(i32a, MAIN_LOCK_INDEX) === MAIN_UNLOCKED);
    if (waitResult.isErr()) {
        return waitResult.asErr();
    }

    // Worker has finished - read response data
    const responseLength = i32a[DATA_INDEX];
    const response = messenger.getPayload(responseLength);

    return Ok(response);
}

/**
 * Calls a worker I/O operation synchronously.
 * Serializes the request, sends to worker, and deserializes the response.
 *
 * @template T - The expected return type.
 * @param op - The I/O operation enum value from `WorkerAsyncOp`.
 * @param args - Arguments to pass to the operation.
 * @returns The I/O operation result wrapped in `IOResult<T>`.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function callWorkerOp<T>(op: WorkerAsyncOp, ...args: any[]): IOResult<T> {
    if (!isSyncAgentConnected()) {
        // too early
        return Err(new Error('Worker not initialized'));
    }

    // Serialize request: [operation, ...arguments]
    const request = [op, ...args];
    const requestData = encodeToBuffer(request);

    return callWorkerFromMain(messengerOnce.get().unwrap(), requestData)
        .andThen(response => {
            // Deserialize response: [error, result] or [error] if failed
            const decodedResponse = decodeFromBuffer<[Error, T]>(response);
            const err = decodedResponse[0];
            return err ? Err(deserializeError(err)) : Ok(decodedResponse[1]);
        });
}

/**
 * Synchronous version of `createFile`.
 * Creates a new empty file at the specified path.
 *
 * @param filePath - The absolute path of the file to create.
 * @returns A `VoidIOResult` indicating success or failure.
 * @see {@link createFile} for the async version.
 * @example
 * ```typescript
 * createFileSync('/path/to/file.txt')
 *     .inspect(() => console.log('File created'));
 * ```
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
 * @example
 * ```typescript
 * mkdirSync('/path/to/directory')
 *     .inspect(() => console.log('Directory created'));
 * ```
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
 * @example
 * ```typescript
 * moveSync('/old/path/file.txt', '/new/path/file.txt')
 *     .inspect(() => console.log('File moved'));
 * ```
 */
export function moveSync(srcPath: string, destPath: string, options?: MoveOptions): VoidIOResult {
    return callWorkerOp(WorkerAsyncOp.move, srcPath, destPath, options);
}

/**
 * Synchronous version of `readDir`.
 * Reads the contents of a directory.
 *
 * **Note:** Returns `DirEntryLike[]` instead of `AsyncIterableIterator<DirEntry>` because:
 * 1. Sync API cannot return async iterators
 * 2. Native `FileSystemHandle` objects cannot be serialized across threads;
 *    `DirEntryLike` uses `FileSystemHandleLike` which is JSON-serializable
 *
 * @param dirPath - The absolute path of the directory to read.
 * @param options - Optional read options (e.g., recursive).
 * @returns An `IOResult` containing an array of directory entries.
 * @see {@link readDir} for the async version.
 * @example
 * ```typescript
 * readDirSync('/documents')
 *     .inspect(entries => entries.forEach(e => console.log(e.path, e.handle.kind)));
 * ```
 */
export function readDirSync(dirPath: string, options?: ReadDirOptions): IOResult<DirEntryLike[]> {
    return callWorkerOp(WorkerAsyncOp.readDir, dirPath, options);
}

/**
 * Synchronous version of `readFile`.
 * Reads the content of a file as a `FileLike` object (blob encoding).
 *
 * @param filePath - The absolute path of the file to read.
 * @param options - Read options with 'blob' encoding.
 * @returns An `IOResult` containing a `FileLike` object.
 * @example
 * ```typescript
 * readFileSync('/path/to/file.txt', { encoding: 'blob' })
 *     .inspect(file => console.log(file.name, file.size));
 * ```
 */
export function readFileSync(filePath: string, options: ReadOptions & {
    encoding: 'blob';
}): IOResult<File>;
/**
 * Synchronous version of `readFile`.
 * Reads the content of a file as a string (utf8 encoding).
 *
 * @param filePath - The absolute path of the file to read.
 * @param options - Read options with 'utf8' encoding.
 * @returns An `IOResult` containing the file content as a string.
 * @example
 * ```typescript
 * readFileSync('/path/to/file.txt', { encoding: 'utf8' })
 *     .inspect(content => console.log(content));
 * ```
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
 * @example
 * ```typescript
 * readFileSync('/path/to/file.bin')
 *     .inspect(buffer => console.log('Size:', buffer.byteLength));
 * ```
 */
export function readFileSync(filePath: string, options?: ReadOptions & {
    encoding?: 'binary';
}): IOResult<ArrayBuffer>;
/**
 * Synchronous version of `readFile`.
 * Reads the content of a file as a Uint8Array.
 *
 * @param filePath - The absolute path of the file to read.
 * @param options - Read options with 'bytes' encoding.
 * @returns An `IOResult` containing the file content as a Uint8Array.
 * @example
 * ```typescript
 * readFileSync('/path/to/file.bin', { encoding: 'bytes' })
 *     .inspect(bytes => console.log('First byte:', bytes[0]));
 * ```
 */
export function readFileSync(filePath: string, options: ReadOptions & {
    encoding: 'bytes';
}): IOResult<Uint8Array<ArrayBuffer>>;
/**
 * Synchronous version of `readFile`.
 * Reads the content of a file with the specified encoding.
 *
 * @param filePath - The absolute path of the file to read.
 * @param options - Optional read options.
 * @returns An `IOResult` containing the file content.
 * @see {@link readFile} for the async version.
 */
export function readFileSync(filePath: string, options?: ReadOptions): IOResult<ReadFileContent> {
    // Runtime guard: sync API cannot return a ReadableStream
    if (options?.encoding === 'stream') {
        return Err(new Error(`readFileSync does not support 'stream' encoding`));
    }

    const res: IOResult<FileLike> = callWorkerOp(WorkerAsyncOp.readBlobFile, filePath);

    return res.map(file => {
        switch (options?.encoding) {
            case 'blob': {
                // File
                return deserializeFile(file);
            }
            case 'bytes': {
                // Uint8Array
                return new Uint8Array(file.data);
            }
            case 'utf8': {
                // string
                return textDecode(new Uint8Array(file.data));
            }
            default: {
                // ArrayBuffer
                return new Uint8Array(file.data).buffer;
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
 * @example
 * ```typescript
 * removeSync('/path/to/file-or-directory')
 *     .inspect(() => console.log('Removed successfully'));
 * ```
 */
export function removeSync(path: string): VoidIOResult {
    return callWorkerOp(WorkerAsyncOp.remove, path);
}

/**
 * Synchronous version of `stat`.
 * Retrieves metadata about a file or directory.
 *
 * **Note:** Returns `FileSystemHandleLike` instead of `FileSystemHandle` because
 * native `FileSystemHandle` objects cannot be serialized across threads.
 * `FileSystemHandleLike` is a plain object with `name` and `kind` properties.
 * For file entries, it also includes `size`, `type`, and `lastModified` -
 * use `isFileHandleLike()` to check and narrow the type.
 *
 * @param path - The absolute path to get status for.
 * @returns An `IOResult` containing a `FileSystemHandleLike` object.
 * @see {@link stat} for the async version.
 * @example
 * ```typescript
 * statSync('/path/to/entry')
 *     .inspect(handle => console.log(`Kind: ${handle.kind}, Name: ${handle.name}`));
 * ```
 */
export function statSync(path: string): IOResult<FileSystemHandleLike> {
    return callWorkerOp(WorkerAsyncOp.stat, path);
}

/**
 * Serializes write contents to a format suitable for JSON transport.
 * Binary data (ArrayBuffer, TypedArray) is converted to number arrays.
 *
 * @param contents - The content to serialize (ArrayBuffer, TypedArray, or string).
 * @returns A number array for binary data, or the original string.
 */
function serializeWriteContents(contents: WriteSyncFileContent): number[] | string {
    if (contents instanceof ArrayBuffer) {
        // ArrayBuffer -> number[]
        return Array.from(new Uint8Array(contents));
    }
    if (ArrayBuffer.isView(contents)) {
        // TypedArray -> number[] (handle potential byteOffset)
        return Array.from(new Uint8Array(contents.buffer, contents.byteOffset, contents.byteLength));
    }
    // String passes through unchanged
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
 * @example
 * ```typescript
 * // Write string content
 * writeFileSync('/path/to/file.txt', 'Hello, World!');
 *
 * // Write binary content
 * writeFileSync('/path/to/file.bin', new Uint8Array([1, 2, 3]));
 * ```
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
 * @example
 * ```typescript
 * appendFileSync('/path/to/log.txt', 'New log entry\n');
 * ```
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
 * @example
 * ```typescript
 * // Copy a file
 * copySync('/src/file.txt', '/dest/file.txt');
 *
 * // Copy without overwriting
 * copySync('/src', '/dest', { overwrite: false });
 * ```
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
 * @example
 * ```typescript
 * emptyDirSync('/path/to/directory');
 * ```
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
 * @example
 * ```typescript
 * existsSync('/path/to/file')
 *     .inspect(exists => exists && console.log('File exists'));
 * ```
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
 * @example
 * ```typescript
 * deleteTempSync();
 * ```
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
 * @example
 * ```typescript
 * mkTempSync({ extname: '.txt' })
 *     .inspect(path => console.log('Temp file:', path));
 * ```
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
 * @example
 * ```typescript
 * // Remove files older than 24 hours
 * const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
 * pruneTempSync(yesterday);
 * ```
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
 * @example
 * ```typescript
 * readBlobFileSync('/path/to/file.txt')
 *     .inspect(file => console.log(file.name, file.size, file.type));
 * ```
 */
export function readBlobFileSync(filePath: string): IOResult<File> {
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
 * @example
 * ```typescript
 * interface Config { name: string; version: number }
 * readJsonFileSync<Config>('/config.json')
 *     .inspect(config => console.log(config.name));
 * ```
 */
export function readJsonFileSync<T>(filePath: string): IOResult<T> {
    return readTextFileSync(filePath).andThen(contents => {
        return tryResult<T, Error, [string]>(JSON.parse, contents);
    });
}

/**
 * Synchronous version of `readTextFile`.
 * Reads a file as a UTF-8 string.
 *
 * @param filePath - The absolute path of the file to read.
 * @returns An `IOResult` containing the file content as a string.
 * @see {@link readTextFile} for the async version.
 * @example
 * ```typescript
 * readTextFileSync('/path/to/file.txt')
 *     .inspect(content => console.log(content));
 * ```
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
 * @example
 * ```typescript
 * const config = { name: 'app', version: 1 };
 * writeJsonFileSync('/config.json', config);
 * ```
 */
export function writeJsonFileSync<T>(filePath: string, data: T): VoidIOResult {
    return tryResult(JSON.stringify, data)
        .andThen(text => writeFileSync(filePath, text));
}

/**
 * Synchronous version of `unzip`.
 * Extracts a zip file to a directory.
 *
 * @param zipFilePath - The path to the zip file.
 * @param targetPath - The directory to extract to.
 * @returns A `VoidIOResult` indicating success or failure.
 * @see {@link unzip} for the async version.
 * @example
 * ```typescript
 * unzipSync('/downloads/archive.zip', '/extracted');
 * ```
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
 * @example
 * ```typescript
 * zipSync('/documents', '/backups/documents.zip');
 * ```
 */
export function zipSync(sourcePath: string, zipFilePath: string, options?: ZipOptions): VoidIOResult;
/**
 * Synchronous version of `zip`.
 * Zips a file or directory and returns the zip data.
 *
 * @param sourcePath - The path to zip.
 * @param options - Optional zip options.
 * @returns An `IOResult` containing the zip data as `Uint8Array`.
 * @example
 * ```typescript
 * zipSync('/documents')
 *     .inspect(data => console.log('Zip size:', data.byteLength));
 * ```
 */
export function zipSync(sourcePath: string, options?: ZipOptions): IOResult<Uint8Array>;
/**
 * Synchronous version of `zip`.
 * Zips a file or directory.
 *
 * @param sourcePath - The path to zip.
 * @param zipFilePath - Optional destination zip file path or options.
 * @param options - Optional zip options.
 * @returns An `IOResult` containing the result.
 * @see {@link zip} for the async version.
 */
export function zipSync(sourcePath: string, zipFilePath?: string | ZipOptions, options?: ZipOptions): IOResult<Uint8Array> | VoidIOResult {
    const res = callWorkerOp(WorkerAsyncOp.zip, sourcePath, zipFilePath, options) as IOResult<number[]> | VoidIOResult;

    return res.map(data => {
        // Data was serialized as number[] for JSON transport, convert back to Uint8Array if present
        return data ? new Uint8Array(data) : data;
    }) as IOResult<Uint8Array> | VoidIOResult;
}