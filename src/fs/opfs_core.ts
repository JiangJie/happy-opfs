import { basename, dirname, join } from '@std/path/posix';
import { Err, Ok, RESULT_VOID, type AsyncIOResult, type AsyncVoidIOResult } from 'happy-rusty';
import { assertAbsolutePath } from './assertions.ts';
import { textEncode } from './codec.ts';
import { NO_STRATEGY_ERROR, NOT_FOUND_ERROR } from './constants.ts';
import type { DirEntry, ReadDirOptions, ReadFileContent, ReadOptions, WriteFileContent, WriteOptions } from './defines.ts';
import { getDirHandle, getFileHandle, isNotFoundError, isRootPath } from './helpers.ts';
import { isDirectoryHandle } from './guards.ts';

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

    return fileHandleRes.andThenAsync(async fileHandle => {
        const file = await fileHandle.getFile();
        switch (options?.encoding) {
            case 'blob': {
                return Ok(file as unknown as T);
            }
            case 'utf8': {
                const text = await file.text();
                return Ok(text as unknown as T);
            }
            default: {
                const data = await file.arrayBuffer();
                return Ok(data as unknown as T);
            }
        }
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

    return (await dirHandleRes.andThenAsync(async (dirHandle): AsyncVoidIOResult => {
        try {
            // root
            if (isRootPath(dirPath) && isRootPath(childName)) {
                // TODO ts not support yet
                await (dirHandle as FileSystemDirectoryHandle & {
                    remove(options?: FileSystemRemoveOptions): Promise<void>;
                }).remove({
                    recursive: true,
                });
            } else {
                await dirHandle.removeEntry(childName, {
                    recursive: true,
                });
            }
        } catch (e) {
            return Err(e as DOMException);
        }

        return RESULT_VOID;
    })).orElse<Error>(err => {
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
        try {
            const fileHandle = await dirHandle.getFileHandle(childName);
            return Ok(fileHandle);
        } catch {
            // Not a file, try as directory
        }

        try {
            const dirChildHandle = await dirHandle.getDirectoryHandle(childName);
            return Ok(dirChildHandle);
        } catch (e) {
            const err = new Error(`${ NOT_FOUND_ERROR }: '${ childName }' does not exist. Full path is '${ path }'`);
            err.name = (e as DOMException).name;

            return Err(err);
        }
    });
}

/**
 * Writes content to a file at the specified path.
 * Creates the file and parent directories if they don't exist (unless `create: false`).
 *
 * @param filePath - The absolute path of the file to write to.
 * @param contents - The content to write (string, ArrayBuffer, TypedArray, or Blob).
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

    return fileHandleRes.andThenAsync(async fileHandle => {
        if (typeof fileHandle.createWritable === 'function') {
            const writable = await fileHandle.createWritable({
                keepExistingData: append,
            });

            try {
                const params: WriteParams = {
                    type: 'write',
                    data: contents,
                };

                // append?
                if (append) {
                    const { size } = await fileHandle.getFile();
                    params.position = size;
                }

                await writable.write(params);
            } finally {
                await writable.close();
            }

            return RESULT_VOID;
        } else if (typeof fileHandle.createSyncAccessHandle === 'function') { // Worker only
            const accessHandle = await fileHandle.createSyncAccessHandle();

            try {
                // Always write as Uint8Array to avoid copying buffer.
                let remaining = typeof contents === 'string'
                    ? textEncode(contents)
                    : contents instanceof Blob
                        ? new Uint8Array(await contents.arrayBuffer())
                        : contents instanceof ArrayBuffer
                            ? new Uint8Array(contents)
                            : new Uint8Array(contents.buffer, contents.byteOffset, contents.byteLength);

                if (!append) {
                    accessHandle.truncate(0);
                }

                while (remaining.byteLength > 0) {
                    const written = accessHandle.write(remaining, {
                        at: append ? accessHandle.getSize() : undefined,
                    });

                    if (written >= remaining.byteLength) {
                        break;
                    }

                    // Create a new Uint8Array for the remaining part without copying buffer.
                    remaining = remaining.subarray(written);
                    console.warn(`Write to OPFS was partial. Wrote ${ written } bytes. Trying to write missing ${ remaining.byteLength } bytes.`);
                }
            } finally {
                accessHandle.close();
            }

            return RESULT_VOID;
        } else {
            const error = new Error('No file write strategy available');
            error.name = NO_STRATEGY_ERROR;
            return Err(error);
        }
    });
}

/**
 * Opens a file and returns a readable stream for reading its contents.
 * Useful for processing large files without loading them entirely into memory.
 *
 * @param filePath - The absolute path of the file to read.
 * @returns A promise that resolves to an `AsyncIOResult` containing a `ReadableStream<Uint8Array>`.
 * @example
 * ```typescript
 * (await readFileStream('/path/to/large-file.bin'))
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
export async function readFileStream(filePath: string): AsyncIOResult<ReadableStream<Uint8Array<ArrayBuffer>>> {
    assertAbsolutePath(filePath);

    const fileHandleRes = await getFileHandle(filePath);

    return fileHandleRes.andThenAsync(async fileHandle => {
        const file = await fileHandle.getFile();
        return Ok(file.stream());
    });
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
 * (await writeFileStream('/path/to/large-file.bin'))
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
export async function writeFileStream(filePath: string, options?: WriteOptions): AsyncIOResult<FileSystemWritableFileStream> {
    assertAbsolutePath(filePath);

    const { append = false, create = true } = options ?? {};

    const fileHandleRes = await getFileHandle(filePath, {
        create,
    });

    return fileHandleRes.andThenAsync(async fileHandle => {
        const writable = await fileHandle.createWritable({
            keepExistingData: append,
        });

        // If appending, seek to end
        if (append) {
            const { size } = await fileHandle.getFile();
            await writable.seek(size);
        }

        return Ok(writable);
    });
}