/**
 * Synchronous file system operations for main thread.
 * Uses SharedArrayBuffer to communicate with worker thread.
 *
 * @module
 */

import { Err, Ok, tryResult, type IOResult, type VoidIOResult } from 'happy-rusty';
import { assertAbsolutePath, assertExistsOptions, assertExpiredDate } from '../async/internal/assertions.ts';
import { textDecode, textEncode } from '../shared/codec.ts';
import { TIMEOUT_ERROR, type CopyOptions, type DirEntryLike, type ExistsOptions, type FileSystemHandleLike, type MoveOptions, type ReadDirSyncOptions, type ReadSyncFileContent, type ReadSyncOptions, type TempOptions, type WriteOptions, type WriteSyncFileContent, type ZipOptions } from '../shared/mod.ts';
import { getGlobalSyncOpTimeout, getMessenger, getSyncChannelState } from './channel/state.ts';
import type { ErrorLike, FileMetadata } from './defines.ts';
import { DATA_INDEX, decodePayload, encodePayload, MAIN_LOCK_INDEX, MAIN_LOCKED, MAIN_UNLOCKED, WORKER_LOCK_INDEX, WORKER_UNLOCKED, WorkerOp, type SyncMessenger } from './protocol.ts';

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
 * Deserializes file metadata and binary data to a `File` instance.
 * Binary data is now received as the last element from the binary protocol.
 *
 * @param metadata - The file metadata (name, type, lastModified).
 * @param data - The binary data as Uint8Array.
 * @returns A `File` instance with the given properties.
 */
function deserializeFile(metadata: FileMetadata, data: Uint8Array<ArrayBuffer>): File {
    const blob = new Blob([data]);

    return new File([blob], metadata.name, {
        type: metadata.type,
        lastModified: metadata.lastModified,
    });
}

/**
 * Blocks execution until a condition is met or timeout occurs.
 * Uses busy-waiting, which is necessary for synchronous operations.
 *
 * @param condition - A function that returns `true` when the wait should end.
 * @returns A `VoidIOResult` - `Ok` if condition met, `Err` with TimeoutError if timed out.
 */
function sleepUntil(condition: () => boolean): VoidIOResult {
    const timeout = getGlobalSyncOpTimeout();
    const start = performance.now();
    while (!condition()) {
        if (performance.now() - start > timeout) {
            const error = new Error('Operation timed out');
            error.name = TIMEOUT_ERROR;

            return Err(error);
        }
    }

    return Ok();
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
function callWorkerFromMain(messenger: SyncMessenger, data: Uint8Array<ArrayBuffer>): IOResult<Uint8Array<SharedArrayBuffer>> {
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
 * @param op - The I/O operation enum value from `WorkerOp`.
 * @param args - Arguments to pass to the operation.
 * @returns The I/O operation result wrapped in `IOResult<T>`.
 */
function callWorkerOp<T>(op: WorkerOp, ...args: unknown[]): IOResult<T> {
    if (getSyncChannelState() !== 'ready') {
        return Err(new Error('Sync channel not connected'));
    }

    const messenger = getMessenger() as SyncMessenger;

    // Serialize request: [operation, ...arguments]
    const request = [op, ...args];
    const requestData = encodePayload(request);

    return callWorkerFromMain(messenger, requestData)
        .andThen(response => {
            // Deserialize response: [error, result] or [error] if failed
            // For binary protocol, if result contains Uint8Array, it's the last element
            const decodedResponse = decodePayload<[Error, ...unknown[]]>(response);
            const err = decodedResponse[0];
            if (err) {
                return Err(deserializeError(err));
            }
            // For single result, return decodedResponse[1]
            // For multi-value result (like readBlobFile), return all elements after error
            if (decodedResponse.length === 2) {
                return Ok(decodedResponse[1] as T);
            }
            // Multi-value result: return slice from index 1
            return Ok(decodedResponse.slice(1) as T);
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
    filePath = assertAbsolutePath(filePath);
    return callWorkerOp(WorkerOp.createFile, filePath);
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
    dirPath = assertAbsolutePath(dirPath);
    return callWorkerOp(WorkerOp.mkdir, dirPath);
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
    srcPath = assertAbsolutePath(srcPath);
    destPath = assertAbsolutePath(destPath);
    return callWorkerOp(WorkerOp.move, srcPath, destPath, options);
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
export function readDirSync(dirPath: string, options?: ReadDirSyncOptions): IOResult<DirEntryLike[]> {
    dirPath = assertAbsolutePath(dirPath);
    return callWorkerOp(WorkerOp.readDir, dirPath, options);
}

/**
 * Synchronous version of `readFile`.
 * Reads the content of a file as a `File` object (blob encoding).
 *
 * @param filePath - The absolute path of the file to read.
 * @param options - Read options with 'blob' encoding.
 * @returns An `IOResult` containing a `File` object.
 * @example
 * ```typescript
 * readFileSync('/path/to/file.txt', { encoding: 'blob' })
 *     .inspect(file => console.log(file.name, file.size));
 * ```
 */
export function readFileSync(filePath: string, options: ReadSyncOptions & {
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
export function readFileSync(filePath: string, options: ReadSyncOptions & {
    encoding: 'utf8';
}): IOResult<string>;
/**
 * Synchronous version of `readFile`.
 * Reads the content of a file as a Uint8Array (default).
 *
 * @param filePath - The absolute path of the file to read.
 * @param options - Optional read options. Defaults to 'bytes' encoding.
 * @returns An `IOResult` containing the file content as a Uint8Array.
 * @example
 * ```typescript
 * readFileSync('/path/to/file.bin')
 *     .inspect(bytes => console.log('First byte:', bytes[0]));
 * ```
 */
export function readFileSync(filePath: string, options?: ReadSyncOptions & {
    encoding?: 'bytes';
}): IOResult<Uint8Array<ArrayBuffer>>;
/**
 * Synchronous version of `readFile`.
 * Reads the content of a file with the specified options.
 * This overload accepts any ReadOptions and returns the union of all possible content types.
 * Useful when the encoding is determined at runtime.
 *
 * @param filePath - The absolute path of the file to read.
 * @param options - Optional read options.
 * @returns An `IOResult` containing the file content.
 * @see {@link readFile} for the async version.
 * @example
 * ```typescript
 * // When encoding is dynamic
 * const encoding = getUserPreference(); // 'utf8' | 'bytes' | ...
 * readFileSync('/path/to/file.txt', { encoding })
 *     .inspect(content => {
 *         // content type is ReadSyncFileContent (union type)
 *         if (typeof content === 'string') {
 *             console.log('Text:', content);
 *         } else if (content instanceof Uint8Array) {
 *             console.log('Bytes:', content.length);
 *         }
 *     });
 * ```
 */
export function readFileSync(filePath: string, options?: ReadSyncOptions): IOResult<ReadSyncFileContent>;
/**
 * Synchronous version of `readFile`.
 * Reads the content of a file with the specified encoding.
 *
 * @param filePath - The absolute path of the file to read.
 * @param options - Optional read options.
 * @returns An `IOResult` containing the file content.
 * @see {@link readFile} for the async version.
 */
export function readFileSync(filePath: string, options?: ReadSyncOptions): IOResult<ReadSyncFileContent> {
    filePath = assertAbsolutePath(filePath);

    const encoding = options?.encoding;

    // blob encoding: use readBlobFile for File object with metadata
    if (encoding === 'blob') {
        // Response is [metadata, Uint8Array] from binary protocol
        const readRes = callWorkerOp<[FileMetadata, Uint8Array<ArrayBuffer>]>(WorkerOp.readBlobFile, filePath);
        return readRes.map(([metadata, data]) => deserializeFile(metadata, data));
    }

    // bytes/utf8: always request bytes encoding from worker
    // This avoids double encoding/decoding for utf8 (string -> bytes -> string)
    const readRes = callWorkerOp<Uint8Array<ArrayBuffer>>(WorkerOp.readFile, filePath);
    return readRes.map(bytes => {
        if (encoding === 'utf8') {
            return textDecode(bytes);
        }
        // 'bytes' or undefined (default)
        return bytes;
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
    path = assertAbsolutePath(path);
    return callWorkerOp(WorkerOp.remove, path);
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
    path = assertAbsolutePath(path);
    return callWorkerOp(WorkerOp.stat, path);
}

/**
 * Serializes write contents to Uint8Array for binary protocol transport.
 * All content types are converted to Uint8Array for efficient binary transfer.
 *
 * @param contents - The content to serialize (ArrayBuffer, TypedArray, or string).
 * @returns Uint8Array containing the binary data.
 */
function serializeWriteContents(contents: WriteSyncFileContent): Uint8Array<ArrayBuffer> {
    if (contents instanceof Uint8Array) {
        return contents as Uint8Array<ArrayBuffer>;
    }
    if (contents instanceof ArrayBuffer) {
        return new Uint8Array(contents);
    }
    if (ArrayBuffer.isView(contents)) {
        // Other TypedArray -> Uint8Array (handle potential byteOffset)
        return new Uint8Array(contents.buffer, contents.byteOffset, contents.byteLength);
    }
    // String -> Uint8Array via TextEncoder
    return textEncode(contents);
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
    filePath = assertAbsolutePath(filePath);
    // Put Uint8Array as the last argument for binary protocol
    return callWorkerOp(WorkerOp.writeFile, filePath, options, serializeWriteContents(contents));
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
    filePath = assertAbsolutePath(filePath);
    // Put Uint8Array as the last argument for binary protocol
    return callWorkerOp(WorkerOp.appendFile, filePath, serializeWriteContents(contents));
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
    srcPath = assertAbsolutePath(srcPath);
    destPath = assertAbsolutePath(destPath);
    return callWorkerOp(WorkerOp.copy, srcPath, destPath, options);
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
    dirPath = assertAbsolutePath(dirPath);
    return callWorkerOp(WorkerOp.emptyDir, dirPath);
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
    path = assertAbsolutePath(path);
    assertExistsOptions(options);
    return callWorkerOp(WorkerOp.exists, path, options);
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
    return callWorkerOp(WorkerOp.deleteTemp);
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
    return callWorkerOp(WorkerOp.mkTemp, options);
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
    assertExpiredDate(expired);
    return callWorkerOp(WorkerOp.pruneTemp, expired);
}

/**
 * Synchronous version of `readBlobFile`.
 * Reads a file as a `File` object.
 *
 * @param filePath - The absolute path of the file to read.
 * @returns An `IOResult` containing a `File` object.
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
 * @param destDir - The directory to unzip to.
 * @returns A `VoidIOResult` indicating success or failure.
 * @see {@link unzip} for the async version.
 * @example
 * ```typescript
 * unzipSync('/downloads/archive.zip', '/extracted');
 * ```
 */
export function unzipSync(zipFilePath: string, destDir: string): VoidIOResult {
    zipFilePath = assertAbsolutePath(zipFilePath);
    destDir = assertAbsolutePath(destDir);
    return callWorkerOp(WorkerOp.unzip, zipFilePath, destDir);
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
export function zipSync(sourcePath: string, options?: ZipOptions): IOResult<Uint8Array<ArrayBuffer>>;
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
export function zipSync(sourcePath: string, zipFilePath?: string | ZipOptions, options?: ZipOptions): IOResult<Uint8Array<ArrayBuffer> | void> {
    sourcePath = assertAbsolutePath(sourcePath);
    // If zipFilePath is a string path, validate it too
    if (typeof zipFilePath === 'string') {
        zipFilePath = assertAbsolutePath(zipFilePath);
    }
    // Result is Uint8Array directly as the last element from binary protocol, or undefined for void result
    return callWorkerOp(WorkerOp.zip, sourcePath, zipFilePath, options);
}
