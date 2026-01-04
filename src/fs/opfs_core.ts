import { basename, dirname, join } from '@std/path/posix';
import { Err, Ok, RESULT_VOID, tryAsyncResult, type AsyncIOResult, type AsyncVoidIOResult } from 'happy-rusty';
import { assertAbsolutePath } from './assertions.ts';
import { textEncode } from './codec.ts';
import { NO_STRATEGY_ERROR } from './constants.ts';
import type { DirEntry, ReadDirOptions, ReadFileContent, ReadOptions, WriteFileContent, WriteOptions } from './defines.ts';
import { isDirectoryHandle } from './guards.ts';
import { getDirHandle, getFileHandle, isNotFoundError, isRootPath } from './helpers.ts';

/**
 * Creates a new empty file at the specified path, similar to the `touch` command.
 * If the file already exists, this operation succeeds without modifying it.
 * Parent directories are created automatically if they don't exist.
 *
 * @param filePath - The absolute path of the file to create.
 * @returns A promise that resolves to an `AsyncVoidIOResult` indicating success or failure.
 * @example
 * ```typescript
 * (await createFile('/path/to/file.txt'))
 *     .inspect(() => console.log('File created successfully'));
 * ```
 */
export async function createFile(filePath: string): AsyncVoidIOResult {
    assertAbsolutePath(filePath);

    const fileHandleRes = await getFileHandle(filePath, {
        create: true,
    });

    return fileHandleRes.and(RESULT_VOID);
}

/**
 * Creates a new directory at the specified path, similar to `mkdir -p`.
 * Creates all necessary parent directories if they don't exist.
 *
 * @param dirPath - The absolute path where the directory will be created.
 * @returns A promise that resolves to an `AsyncVoidIOResult` indicating success or failure.
 * @example
 * ```typescript
 * (await mkdir('/path/to/new/directory'))
 *     .inspect(() => console.log('Directory created successfully'));
 * ```
 */
export async function mkdir(dirPath: string): AsyncVoidIOResult {
    assertAbsolutePath(dirPath);

    const dirHandleRes = await getDirHandle(dirPath, {
        create: true,
    });

    return dirHandleRes.and(RESULT_VOID);
}

/**
 * Reads the contents of a directory at the specified path.
 *
 * @param dirPath - The path of the directory to read.
 * @param options - Options of readdir.
 * @returns A promise that resolves to an `AsyncIOResult` containing an async iterable iterator over the entries of the directory.
 * @example
 * ```typescript
 * // List directory contents
 * (await readDir('/documents'))
 *     .inspect(async entries => {
 *         for await (const entry of entries) {
 *             console.log(entry.path, entry.handle.kind);
 *         }
 *     });
 *
 * // List recursively
 * await readDir('/documents', { recursive: true });
 * ```
 */
export async function readDir(dirPath: string, options?: ReadDirOptions): AsyncIOResult<AsyncIterableIterator<DirEntry>> {
    assertAbsolutePath(dirPath);

    const dirHandleRes = await getDirHandle(dirPath);

    async function* read(dirHandle: FileSystemDirectoryHandle, subDirPath: string): AsyncIterableIterator<DirEntry> {
        const entries = dirHandle.entries();

        for await (const [name, handle] of entries) {
            // relative path from `dirPath`
            const path = subDirPath === dirPath ? name : join(subDirPath, name);
            yield {
                path,
                handle,
            };

            if (options?.recursive && isDirectoryHandle(handle)) {
                yield* read(handle, path);
            }
        }
    }

    return dirHandleRes.andThen(x => Ok(read(x, dirPath)));
}

/**
 * Reads the content of a file at the specified path as a File.
 *
 * @param filePath - The path of the file to read.
 * @param options - Read options specifying the 'blob' encoding.
 * @returns A promise that resolves to an `AsyncIOResult` containing the file content as a File.
 * @example
 * ```typescript
 * (await readFile('/path/to/file.txt', { encoding: 'blob' }))
 *     .inspect(file => console.log(file.name, file.size, file.type));
 * ```
 */
export function readFile(filePath: string, options: ReadOptions & {
    encoding: 'blob';
}): AsyncIOResult<File>;

/**
 * Reads the content of a file at the specified path as a string.
 *
 * @param filePath - The path of the file to read.
 * @param options - Read options specifying the 'utf8' encoding.
 * @returns A promise that resolves to an `AsyncIOResult` containing the file content as a string.
 * @example
 * ```typescript
 * (await readFile('/path/to/file.txt', { encoding: 'utf8' }))
 *     .inspect(content => console.log(content));
 * ```
 */
export function readFile(filePath: string, options: ReadOptions & {
    encoding: 'utf8';
}): AsyncIOResult<string>;

/**
 * Reads the content of a file at the specified path as a readable stream.
 * Useful for processing large files without loading them entirely into memory.
 *
 * @param filePath - The path of the file to read.
 * @param options - Read options specifying the 'stream' encoding.
 * @returns A promise that resolves to an `AsyncIOResult` containing a `ReadableStream<Uint8Array>`.
 * @example
 * ```typescript
 * (await readFile('/path/to/large-file.bin', { encoding: 'stream' }))
 *     .inspect(async stream => {
 *         const reader = stream.getReader();
 *         while (true) {
 *             const { done, value } = await reader.read();
 *             if (done) break;
 *             console.log('Received chunk:', value.length, 'bytes');
 *         }
 *     });
 * ```
 */
export function readFile(filePath: string, options: ReadOptions & {
    encoding: 'stream';
}): AsyncIOResult<ReadableStream<Uint8Array<ArrayBuffer>>>;

/**
 * Reads the content of a file at the specified path as an ArrayBuffer by default.
 *
 * @param filePath - The path of the file to read.
 * @param options - Read options specifying the 'binary' encoding.
 * @returns A promise that resolves to an `AsyncIOResult` containing the file content as an ArrayBuffer.
 * @example
 * ```typescript
 * (await readFile('/path/to/file.bin'))
 *     .inspect(buffer => console.log('File size:', buffer.byteLength));
 * ```
 */
export function readFile(filePath: string, options?: ReadOptions & {
    encoding: 'binary';
}): AsyncIOResult<ArrayBuffer>;

/**
 * Reads the content of a file at the specified path with the specified options.
 *
 * @template T The type of the content to read from the file.
 * @param filePath - The path of the file to read.
 * @param options - Optional read options.
 * @returns A promise that resolves to an `AsyncIOResult` containing the file content.
 */
export async function readFile<T extends ReadFileContent>(filePath: string, options?: ReadOptions): AsyncIOResult<T> {
    assertAbsolutePath(filePath);

    const fileHandleRes = await getFileHandle(filePath);

    return fileHandleRes.andThenAsync(fileHandle => {
        return tryAsyncResult(async () => {
            const file = await fileHandle.getFile();
            switch (options?.encoding) {
                case 'blob': {
                    return file as unknown as T;
                }
                case 'utf8': {
                    return await file.text() as unknown as T;
                }
                case 'stream': {
                    return file.stream() as unknown as T;
                }
                default: {
                    return await file.arrayBuffer() as unknown as T;
                }
            }
        });
    });
}

/**
 * Removes a file or directory at the specified path, similar to `rm -rf`.
 * If the path doesn't exist, the operation succeeds silently.
 *
 * @param path - The absolute path of the file or directory to remove.
 * @returns A promise that resolves to an `AsyncVoidIOResult` indicating success or failure.
 * @example
 * ```typescript
 * (await remove('/path/to/file-or-directory'))
 *     .inspect(() => console.log('Removed successfully'));
 * ```
 */
export async function remove(path: string): AsyncVoidIOResult {
    assertAbsolutePath(path);

    const dirPath = dirname(path);
    const childName = basename(path);

    const dirHandleRes = await getDirHandle(dirPath);

    const removeRes = await dirHandleRes.andThenAsync((dirHandle) => {
        const options: FileSystemRemoveOptions = {
            recursive: true,
        };
        // root
        if (isRootPath(dirPath) && isRootPath(childName)) {
            // TODO ts not support yet
            return tryAsyncResult((dirHandle as FileSystemDirectoryHandle & {
                remove(options?: FileSystemRemoveOptions): Promise<void>;
            }).remove(options));
        } else {
            return tryAsyncResult(dirHandle.removeEntry(childName, options));
        }
    });

    return removeRes.orElse(err => {
        // not found as success
        return isNotFoundError(err) ? RESULT_VOID : Err(err);
    });
}

/**
 * Retrieves the `FileSystemHandle` for a file or directory at the specified path.
 * Can be used to check the type (file or directory) and access metadata.
 *
 * @param path - The absolute path of the file or directory.
 * @returns A promise that resolves to an `AsyncIOResult` containing the `FileSystemHandle`.
 * @example
 * ```typescript
 * (await stat('/path/to/entry'))
 *     .inspect(handle => console.log(`Kind: ${handle.kind}, Name: ${handle.name}`));
 * ```
 */
export async function stat(path: string): AsyncIOResult<FileSystemHandle> {
    assertAbsolutePath(path);

    const dirPath = dirname(path);
    const childName = basename(path);

    const dirHandleRes = await getDirHandle(dirPath);
    if (!childName || isRootPath(childName)) {
        // root
        return dirHandleRes;
    }

    return dirHandleRes.andThenAsync(async dirHandle => {
        // Try to get the handle directly instead of iterating
        // First try as file, then as directory
        let res = await tryAsyncResult<FileSystemHandle>(dirHandle.getFileHandle(childName));
        if (res.isOk()) {
            return res;
        }

        // Not a file, try as directory
        res = await tryAsyncResult<FileSystemHandle>(dirHandle.getDirectoryHandle(childName));

        return res.mapErr(err => {
            const error = new Error(`${ err.name }: '${ childName }' does not exist. Full path is '${ path }'`);
            error.name = err.name;
            return error;
        });
    });
}

/**
 * Writes content to a file at the specified path.
 * Creates the file and parent directories if they don't exist (unless `create: false`).
 *
 * @param filePath - The absolute path of the file to write to.
 * @param contents - The content to write (string, ArrayBuffer, TypedArray, Blob, or ReadableStream<Uint8Array>).
 * @param options - Optional write options.
 * @param options.create - Whether to create the file if it doesn't exist. Default: `true`.
 * @param options.append - Whether to append to the file instead of overwriting. Default: `false`.
 * @returns A promise that resolves to an `AsyncVoidIOResult` indicating success or failure.
 * @example
 * ```typescript
 * // Write string content
 * await writeFile('/path/to/file.txt', 'Hello, World!');
 *
 * // Write binary content
 * await writeFile('/path/to/file.bin', new Uint8Array([1, 2, 3]));
 *
 * // Append to existing file
 * await writeFile('/path/to/file.txt', '\nMore content', { append: true });
 * ```
 */
export async function writeFile(filePath: string, contents: WriteFileContent, options?: WriteOptions): AsyncVoidIOResult {
    assertAbsolutePath(filePath);

    // create as default
    const { append = false, create = true } = options ?? {};

    const fileHandleRes = await getFileHandle(filePath, {
        create,
    });

    return fileHandleRes.andThenAsync(fileHandle => {
        if (typeof fileHandle.createWritable === 'function') {
            // Main thread strategy
            const writePromise = isBinaryReadableStream(contents)
                ? writeStreamViaWritable(fileHandle, contents, append)
                : writeDataViaWritable(fileHandle, contents, append);
            return tryAsyncResult(writePromise);
        } else if (typeof fileHandle.createSyncAccessHandle === 'function') {
            // Worker strategy
            const writePromise = isBinaryReadableStream(contents)
                ? writeStreamViaSyncAccess(fileHandle, contents, append)
                : writeDataViaSyncAccess(fileHandle, contents, append);
            return tryAsyncResult(writePromise);
        } else {
            const error = new Error('No file write strategy available');
            error.name = NO_STRATEGY_ERROR;
            return Err(error);
        }
    });
}

/**
 * Type guard for detecting binary ReadableStream input for file writing.
 *
 * Note: uses `instanceof ReadableStream`, which may not work across realms (e.g. iframe)
 */
function isBinaryReadableStream(x: unknown): x is ReadableStream<Uint8Array<ArrayBuffer>> {
    return typeof ReadableStream !== 'undefined' && x instanceof ReadableStream;
}

/**
 * Writes a ReadableStream to a file using the main thread's FileSystemWritableFileStream API.
 */
async function writeStreamViaWritable(
    fileHandle: FileSystemFileHandle,
    stream: ReadableStream<Uint8Array<ArrayBuffer>>,
    append: boolean,
): Promise<void> {
    const reader = stream.getReader();
    const writable = await fileHandle.createWritable({
        keepExistingData: append,
    });

    try {
        if (append) {
            const { size } = await fileHandle.getFile();
            await writable.seek(size);
        }

        while (true) {
            const { done, value } = await reader.read();
            if (done) {
                break;
            }

            await writable.write({
                type: 'write',
                data: value,
            });
        }
    } finally {
        await writable.close();
    }
}

/**
 * Writes non-stream data to a file using the main thread's FileSystemWritableFileStream API.
 */
async function writeDataViaWritable(
    fileHandle: FileSystemFileHandle,
    contents: Exclude<WriteFileContent, ReadableStream>,
    append: boolean,
): Promise<void> {
    const writable = await fileHandle.createWritable({
        keepExistingData: append,
    });

    try {
        const params: WriteParams = {
            type: 'write',
            data: contents,
        };

        if (append) {
            const { size } = await fileHandle.getFile();
            params.position = size;
        }

        await writable.write(params);
    } finally {
        await writable.close();
    }
}

/**
 * Writes a ReadableStream to a file using the Worker's FileSystemSyncAccessHandle API.
 */
async function writeStreamViaSyncAccess(
    fileHandle: FileSystemFileHandle,
    stream: ReadableStream<Uint8Array<ArrayBuffer>>,
    append: boolean,
): Promise<void> {
    const reader = stream.getReader();
    const accessHandle = await fileHandle.createSyncAccessHandle();

    try {
        if (!append) {
            accessHandle.truncate(0);
        }

        let position = append ? accessHandle.getSize() : 0;

        while (true) {
            const { done, value } = await reader.read();
            if (done) {
                break;
            }

            position = writeBytesWithRetry(accessHandle, value, position);
        }
    } finally {
        accessHandle.close();
    }
}

/**
 * Writes non-stream data to a file using the Worker's FileSystemSyncAccessHandle API.
 */
async function writeDataViaSyncAccess(
    fileHandle: FileSystemFileHandle,
    contents: Exclude<WriteFileContent, ReadableStream>,
    append: boolean,
): Promise<void> {
    const accessHandle = await fileHandle.createSyncAccessHandle();

    try {
        // Always write as Uint8Array to avoid copying buffer.
        const data = typeof contents === 'string'
            ? textEncode(contents)
            : contents instanceof Blob
                ? new Uint8Array(await contents.arrayBuffer())
                : contents instanceof ArrayBuffer
                    ? new Uint8Array(contents)
                    : new Uint8Array(contents.buffer, contents.byteOffset, contents.byteLength);

        if (!append) {
            accessHandle.truncate(0);
        }

        const position = append ? accessHandle.getSize() : undefined;
        writeBytesWithRetry(accessHandle, data as Uint8Array<ArrayBuffer>, position);
    } finally {
        accessHandle.close();
    }
}

/**
 * Writes bytes to a FileSystemSyncAccessHandle with retry logic for partial writes.
 * Returns the final position after writing.
 */
function writeBytesWithRetry(
    accessHandle: FileSystemSyncAccessHandle,
    data: Uint8Array<ArrayBuffer>,
    position?: number,
): number {
    let remaining = data;
    let currentPosition = position ?? 0;

    while (remaining.byteLength > 0) {
        const written = accessHandle.write(remaining, {
            at: currentPosition,
        });

        if (written >= remaining.byteLength) {
            currentPosition += written;
            break;
        }

        // Create a new Uint8Array for the remaining part without copying buffer.
        remaining = remaining.subarray(written);
        currentPosition += written;
    }

    return currentPosition;
}

/**
 * Opens a file and returns a readable stream for reading its contents.
 * Useful for processing large files without loading them entirely into memory.
 *
 * @deprecated Use `readFile(filePath, { encoding: 'stream' })` instead. This function will be removed in the next major version.
 * @param filePath - The absolute path of the file to read.
 * @returns A promise that resolves to an `AsyncIOResult` containing a `ReadableStream<Uint8Array>`.
 * @example
 * ```typescript
 * // Deprecated usage:
 * (await readFileStream('/path/to/large-file.bin'))
 *     .inspect(async stream => {
 *         const reader = stream.getReader();
 *         while (true) {
 *             const { done, value } = await reader.read();
 *             if (done) break;
 *             console.log('Received chunk:', value.length, 'bytes');
 *         }
 *     });
 *
 * // New usage:
 * (await readFile('/path/to/large-file.bin', { encoding: 'stream' }))
 *     .inspect(async stream => {
 *         // same as above
 *     });
 * ```
 */
export function readFileStream(filePath: string): AsyncIOResult<ReadableStream<Uint8Array<ArrayBuffer>>> {
    return readFile(filePath, { encoding: 'stream' });
}

/**
 * Opens a file and returns a writable stream for writing contents.
 * Useful for writing large files without loading them entirely into memory.
 * The caller is responsible for closing the stream when done.
 *
 * @param filePath - The absolute path of the file to write.
 * @param options - Optional write options.
 * @returns A promise that resolves to an `AsyncIOResult` containing a `FileSystemWritableFileStream`.
 * @example
 * ```typescript
 * (await openWritableFileStream('/path/to/large-file.bin'))
 *     .inspect(async stream => {
 *         try {
 *             await stream.write(new Uint8Array([1, 2, 3]));
 *             await stream.write(new Uint8Array([4, 5, 6]));
 *         } finally {
 *             await stream.close();
 *         }
 *     });
 * ```
 */
export async function openWritableFileStream(filePath: string, options?: WriteOptions): AsyncIOResult<FileSystemWritableFileStream> {
    assertAbsolutePath(filePath);

    const { append = false, create = true } = options ?? {};

    const fileHandleRes = await getFileHandle(filePath, {
        create,
    });

    return fileHandleRes.andThenAsync(fileHandle => {
        return tryAsyncResult(async () => {
            const writable = await fileHandle.createWritable({
                keepExistingData: append,
            });

            // If appending, seek to end
            if (append) {
                const { size } = await fileHandle.getFile();
                await writable.seek(size);
            }

            return writable;
        });
    });
}

/**
 * Opens a file and returns a writable stream for writing contents.
 * Useful for writing large files without loading them entirely into memory.
 * The caller is responsible for closing the stream when done.
 *
 * @deprecated Use `openWritableFileStream` instead. This function will be removed in the next major version.
 * @param filePath - The absolute path of the file to write.
 * @param options - Optional write options.
 * @returns A promise that resolves to an `AsyncIOResult` containing a `FileSystemWritableFileStream`.
 * @example
 * ```typescript
 * // Deprecated usage:
 * (await writeFileStream('/path/to/large-file.bin'))
 *     .inspect(async stream => {
 *         // ...
 *     });
 *
 * // New usage:
 * (await openWritableFileStream('/path/to/large-file.bin'))
 *     .inspect(async stream => {
 *         // ...
 *     });
 * ```
 */
export function writeFileStream(filePath: string, options?: WriteOptions): AsyncIOResult<FileSystemWritableFileStream> {
    return openWritableFileStream(filePath, options);
}
