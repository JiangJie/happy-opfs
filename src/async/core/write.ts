import { tryAsyncResult, type AsyncIOResult, type AsyncVoidIOResult } from 'happy-rusty';
import { textEncode } from '../../shared/codec.ts';
import { readBlobBytesSync } from '../../shared/helpers.ts';
import type { WriteFileContent, WriteOptions } from '../../shared/mod.ts';
import { getFileHandle, isNotFoundError, moveFileHandle, validateAbsolutePath } from '../internal/mod.ts';
import { generateTempPath } from '../tmp.ts';
import { remove } from './remove.ts';

/**
 * Writes content to a file at the specified path.
 * Creates the file and parent directories if they don't exist (unless `create: false`).
 *
 * When writing a `ReadableStream` to a **new file**, the stream is first written to a temporary
 * file in `/tmp`, then moved to the target path upon success. This prevents leaving incomplete
 * files if the stream is interrupted. For existing files, writes are performed directly since
 * OPFS's transactional writes preserve the original content on failure.
 *
 * @param filePath - The absolute path of the file to write to.
 * @param contents - The content to write (string, ArrayBuffer, TypedArray, Blob, or ReadableStream<Uint8Array>).
 * @param options - Optional write options.
 * @param options.create - Whether to create the file if it doesn't exist. Default: `true`.
 * @param options.append - Whether to append to the file instead of overwriting. Default: `false`.
 * @returns A promise that resolves to an `AsyncVoidIOResult` indicating success or failure.
 * @since 1.0.0
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
    const filePathRes = validateAbsolutePath(filePath);
    if (filePathRes.isErr()) return filePathRes.asErr();
    filePath = filePathRes.unwrap();

    // For stream content, use temp file strategy when creating new files
    if (isBinaryReadableStream(contents)) {
        return writeStreamToFile(filePath, contents, options);
    }

    const fileHandleRes = await getWriteFileHandle(filePath, options);

    return fileHandleRes.andTryAsync(fileHandle => {
        const { append = false } = options ?? {};

        // Prefer sync access in Worker for better performance
        if (typeof fileHandle.createSyncAccessHandle === 'function') {
            return writeDataViaSyncAccess(fileHandle, contents, append);
        }

        // Main thread fallback
        return writeDataViaWritable(fileHandle, contents, append);
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
 * @since 1.0.0
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
    const filePathRes = validateAbsolutePath(filePath);
    if (filePathRes.isErr()) return filePathRes.asErr();
    filePath = filePathRes.unwrap();

    const fileHandleRes = await getWriteFileHandle(filePath, options);

    return fileHandleRes.andTryAsync(async fileHandle => {
        const { append = false } = options ?? {};

        const writable = await fileHandle.createWritable({
            keepExistingData: append,
        });

        // If appending, seek to end
        if (append) {
            try {
                const { size } = await fileHandle.getFile();
                await writable.seek(size);
            } catch (err) {
                await writable.close();
                throw err;
            }
        }

        return writable;
    });
}

/**
 * Gets a file handle for writing, with optional creation.
 */
function getWriteFileHandle(filePath: string, options?: WriteOptions): AsyncIOResult<FileSystemFileHandle> {
    const { create = true } = options ?? {};
    return getFileHandle(filePath, { create });
}

/**
 * Type guard for detecting binary ReadableStream input for file writing.
 */
function isBinaryReadableStream(x: unknown): x is ReadableStream<Uint8Array<ArrayBuffer>> {
    return typeof ReadableStream !== 'undefined' && x instanceof ReadableStream;
}

/**
 * Writes a ReadableStream to a file with atomic semantics for new files.
 *
 * Strategy:
 * - If target file exists: write directly (OPFS transactional writes preserve original on failure)
 * - If target file doesn't exist: write to temp file first, then move to target on success
 *
 * This prevents leaving incomplete/empty files when stream is interrupted during new file creation.
 *
 * Assumes filePath is already validated.
 */
async function writeStreamToFile(
    filePath: string,
    stream: ReadableStream<Uint8Array<ArrayBuffer>>,
    options?: WriteOptions,
): AsyncVoidIOResult {
    const { create = true, append = false } = options ?? {};

    // Check if target file already exists
    const existHandleRes = await getFileHandle(filePath, { create: false });

    if (existHandleRes.isOk()) {
        // File exists: write directly (transactional protection)
        return writeStreamToHandle(existHandleRes.unwrap(), stream, append);
    }

    // File doesn't exist or unexpected error - return error if not creating or not a NotFoundError
    if (!create || !isNotFoundError(existHandleRes.unwrapErr())) {
        return existHandleRes.asErr();
    }

    // New file: use temp file strategy
    const tempPath = generateTempPath();
    const tempHandleRes = await getFileHandle(tempPath, { create: true });
    if (tempHandleRes.isErr()) {
        return tempHandleRes.asErr();
    }

    const tempHandle = tempHandleRes.unwrap();
    const writeRes = await writeStreamToHandle(tempHandle, stream, false);

    if (writeRes.isErr()) {
        // Clean up temp file on failure
        await remove(tempPath);
        return writeRes;
    }

    // Move temp file to target path (this creates parent directories if needed)
    const moveRes = await moveFileHandle(tempHandle, filePath);
    if (moveRes.isErr()) {
        // Clean up temp file
        await remove(tempPath);
    }

    return moveRes;
}

/**
 * Writes a stream to a file handle using the appropriate API.
 */
async function writeStreamToHandle(
    fileHandle: FileSystemFileHandle,
    stream: ReadableStream<Uint8Array<ArrayBuffer>>,
    append: boolean,
): AsyncVoidIOResult {
    return tryAsyncResult(() => {
        // Prefer sync access in Worker for better performance
        if (typeof fileHandle.createSyncAccessHandle === 'function') {
            return writeStreamViaSyncAccess(fileHandle, stream, append);
        }
        // Main thread fallback
        return writeStreamViaWritable(fileHandle, stream, append);
    });
}

/**
 * Writes a ReadableStream to a file using the main thread's FileSystemWritableFileStream API.
 */
async function writeStreamViaWritable(
    fileHandle: FileSystemFileHandle,
    stream: ReadableStream<Uint8Array<ArrayBuffer>>,
    append: boolean,
): Promise<void> {
    const writable = await fileHandle.createWritable({
        keepExistingData: append,
    });

    if (append) {
        const { size } = await fileHandle.getFile();
        await writable.seek(size);
    }

    return stream.pipeTo(writable);
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

        return writable.write(params);
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
    const accessHandle = await fileHandle.createSyncAccessHandle();

    try {
        if (!append) {
            accessHandle.truncate(0);
        }

        let position = append ? accessHandle.getSize() : 0;

        for await (const chunk of stream) {
            position = writeBytesWithRetry(accessHandle, chunk, position);
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
        let bytes: Uint8Array<ArrayBuffer>;
        if (typeof contents === 'string') {
            bytes = textEncode(contents);
        } else if (contents instanceof Blob) {
            bytes = readBlobBytesSync(contents);
        } else if (contents instanceof ArrayBuffer) {
            bytes = new Uint8Array(contents);
        } else if (contents instanceof Uint8Array) {
            bytes = contents as Uint8Array<ArrayBuffer>;
        } else {
            bytes = new Uint8Array(contents.buffer, contents.byteOffset, contents.byteLength);
        }

        if (!append) {
            accessHandle.truncate(0);
        }

        const position = append ? accessHandle.getSize() : 0;
        writeBytesWithRetry(accessHandle, bytes, position);
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
    bytes: Uint8Array<ArrayBuffer>,
    position: number,
): number {
    let remaining = bytes;
    let currentPosition = position;

    while (remaining.byteLength > 0) {
        const written = accessHandle.write(remaining, {
            at: currentPosition,
        });

        currentPosition += written;

        if (written >= remaining.byteLength) {
            break;
        }

        // Create a new Uint8Array for the remaining part without copying buffer.
        remaining = remaining.subarray(written);
    }

    return currentPosition;
}
