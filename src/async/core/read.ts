import { join } from '@std/path/posix';
import { Err, Ok, type AsyncIOResult } from 'happy-rusty';
import { textDecode } from '../../shared/codec.ts';
import { readBlobBytes } from '../../shared/helpers.ts';
import { isDirectoryHandle, type DirEntry, type ReadDirOptions, type ReadFileContent, type ReadOptions } from '../../shared/mod.ts';
import { createAbortError, getDirHandle, getFileHandle, validateAbsolutePath } from '../internal/mod.ts';

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
    const dirPathRes = validateAbsolutePath(dirPath);
    if (dirPathRes.isErr()) return dirPathRes.asErr();
    dirPath = dirPathRes.unwrap();

    const dirHandleRes = await getDirHandle(dirPath);
    if (dirHandleRes.isErr()) {
        return dirHandleRes.asErr();
    }

    // Check if aborted after getting handle
    if (options?.signal?.aborted) {
        const { reason } = options.signal;
        return Err(reason instanceof Error ? reason : createAbortError());
    }

    async function* read(dirHandle: FileSystemDirectoryHandle, relativePath?: string): AsyncIterableIterator<DirEntry> {
        if (options?.signal?.aborted) {
            return;
        }

        for await (const [name, handle] of dirHandle.entries()) {
            // Check if aborted before yielding each entry
            if (options?.signal?.aborted) {
                return;
            }

            const path = relativePath ? join(relativePath, name) : name;
            yield {
                path,
                handle,
            };

            if (options?.recursive && isDirectoryHandle(handle)) {
                yield* read(handle, path);
            }
        }
    }

    return Ok(read(dirHandleRes.unwrap()));
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
 * Reads the content of a file at the specified path as a Uint8Array (default).
 *
 * @param filePath - The path of the file to read.
 * @param options - Optional read options. Defaults to 'bytes' encoding.
 * @returns A promise that resolves to an `AsyncIOResult` containing the file content as a Uint8Array.
 * @example
 * ```typescript
 * (await readFile('/path/to/file.bin'))
 *     .inspect(bytes => console.log('First byte:', bytes[0]));
 * ```
 */
export function readFile(filePath: string, options?: ReadOptions & {
    encoding?: 'bytes';
}): AsyncIOResult<Uint8Array<ArrayBuffer>>;

/**
 * Reads the content of a file at the specified path with the specified options.
 * This overload accepts any ReadOptions and returns the union of all possible content types.
 * Useful when the encoding is determined at runtime.
 *
 * @param filePath - The path of the file to read.
 * @param options - Optional read options.
 * @returns A promise that resolves to an `AsyncIOResult` containing the file content.
 * @example
 * ```typescript
 * // When encoding is dynamic
 * const encoding = getUserPreference(); // 'utf8' | 'bytes' | ...
 * (await readFile('/path/to/file.txt', { encoding }))
 *     .inspect(content => {
 *         // content type is ReadFileContent (union type)
 *         if (typeof content === 'string') {
 *             console.log('Text:', content);
 *         } else if (content instanceof Uint8Array) {
 *             console.log('Bytes:', content.length);
 *         }
 *     });
 * ```
 */
export function readFile(filePath: string, options?: ReadOptions): AsyncIOResult<ReadFileContent>;

/**
 * Reads the content of a file at the specified path with the specified options.
 *
 * @template T The type of the content to read from the file.
 * @param filePath - The path of the file to read.
 * @param options - Optional read options.
 * @returns A promise that resolves to an `AsyncIOResult` containing the file content.
 */
export async function readFile(filePath: string, options?: ReadOptions): AsyncIOResult<ReadFileContent> {
    const filePathRes = validateAbsolutePath(filePath);
    if (filePathRes.isErr()) return filePathRes.asErr();
    filePath = filePathRes.unwrap();

    const fileHandleRes = await getFileHandle(filePath);

    return fileHandleRes.andTryAsync(async fileHandle => {
        const encoding = options?.encoding;

        // Prefer sync access in Worker for better performance
        // Only for encodings that don't require File object or streaming
        return encoding !== 'blob' && encoding !== 'stream' && typeof fileHandle.createSyncAccessHandle === 'function'
            ? readViaSyncAccess(fileHandle, encoding)
            // Main thread fallback or blob/stream encoding
            : readViaFile(fileHandle, encoding);
    });
}

/**
 * Reads file content using the Worker's FileSystemSyncAccessHandle API.
 * More performant than File-based reading in Worker context.
 */
async function readViaSyncAccess(
    fileHandle: FileSystemFileHandle,
    encoding?: 'bytes' | 'utf8',
): Promise<Uint8Array<ArrayBuffer> | string> {
    const accessHandle = await fileHandle.createSyncAccessHandle();

    try {
        const size = accessHandle.getSize();
        const bytes = new Uint8Array(size);
        accessHandle.read(bytes, { at: 0 });

        if (encoding === 'utf8') {
            return textDecode(bytes);
        }
        // 'bytes' or undefined (default)
        return bytes;
    } finally {
        accessHandle.close();
    }
}

/**
 * Reads file content using the File API (main thread strategy).
 */
async function readViaFile(
    fileHandle: FileSystemFileHandle,
    encoding?: 'bytes' | 'utf8' | 'blob' | 'stream',
): Promise<ReadFileContent> {
    const file = await fileHandle.getFile();

    switch (encoding) {
        case 'blob': {
            return file;
        }
        case 'utf8': {
            return file.text();
        }
        case 'stream': {
            return file.stream();
        }
        default: {
            // 'bytes' or undefined (default)
            return readBlobBytes(file);
        }
    }
}
