import type { AsyncIOResult, AsyncVoidIOResult } from 'happy-rusty';
import { textEncode } from '../../shared/codec.ts';
import { readBlobBytesSync } from '../../shared/helpers.ts';
import type { WriteFileContent, WriteOptions } from '../../shared/mod.ts';
import { assertAbsolutePath, getFileHandle } from '../internal/mod.ts';

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
    const fileHandleRes = await getWriteFileHandle(filePath, options);

    return fileHandleRes.andTryAsync(fileHandle => {
        const { append = false } = options ?? {};

        // Prefer sync access in Worker for better performance
        if (typeof fileHandle.createSyncAccessHandle === 'function') {
            return isBinaryReadableStream(contents)
                ? writeStreamViaSyncAccess(fileHandle, contents, append)
                : writeDataViaSyncAccess(fileHandle, contents, append);
        }

        // Main thread fallback
        return isBinaryReadableStream(contents)
            ? writeStreamViaWritable(fileHandle, contents, append)
            : writeDataViaWritable(fileHandle, contents, append);
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
    filePath = assertAbsolutePath(filePath);
    const { create = true } = options ?? {};
    return getFileHandle(filePath, { create });
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
