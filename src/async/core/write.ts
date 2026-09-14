import { tryAsyncResult, type AsyncIOResult, type AsyncVoidIOResult } from 'happy-rusty';
import {
    readBlobBytesSync,
    toBytesView,
    validateAbsolutePath,
    validateWriteFileContent,
} from '../../shared/internal/mod.ts';
import type { WriteFileContent, WriteOptions } from '../../shared/mod.ts';
import { generateTempPath } from '../../shared/mod.ts';
import { getFileHandle, isNotFoundError, moveFileHandle } from '../internal/mod.ts';
import { remove } from './remove.ts';

/**
 * Writes content to a file at the specified path.
 * Creates the file and parent directories if they don't exist (unless `create: false`).
 *
 * Overwriting inside a Worker is written to a temporary file in `/tmp` first and moved into
 * place on success, so an interrupted write leaves the previous content untouched. The main
 * thread's `createWritable` writes a swap file instead and needs no temp file. Appending
 * always writes in place.
 *
 * @param filePath - The absolute path of the file to write to.
 * @param contents - The content to write (string, ArrayBuffer, TypedArray, Blob, or ReadableStream<Uint8Array>).
 * @param options - Optional write options.
 * @param options.create - Whether to create the file if it doesn't exist. Default: `true`.
 * @param options.append - Whether to append to the file instead of overwriting. Default: `false`.
 * @returns A promise that resolves to an `AsyncVoidIOResult` indicating success or failure.
 * @since 1.0.0
 * @see {@link writeFileSync} for synchronous version
 * @see {@link appendFile} for appending to files
 * @see {@link writeJsonFile} for writing JSON data
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
export async function writeFile(
    filePath: string,
    contents: WriteFileContent,
    options?: WriteOptions,
): AsyncVoidIOResult {
    const filePathRes = validateAbsolutePath(filePath);
    if (filePathRes.isErr()) return filePathRes.asErr();
    filePath = filePathRes.unwrap();

    // Validate content type at entry point to prevent silent failures
    const contentRes = validateWriteFileContent(contents);
    if (contentRes.isErr()) return contentRes.asErr();

    // For stream content, use temp file strategy when creating new files
    if (isBinaryReadableStream(contents)) {
        return writeStreamToFile(filePath, contents, options);
    }

    const fileHandleRes = await getWriteFileHandle(filePath, options);
    if (fileHandleRes.isErr()) {
        return fileHandleRes.asErr();
    }

    const fileHandle = fileHandleRes.unwrap();
    const { append = false } = options ?? {};

    if (isSyncAccessHandleSupported(fileHandle)) {
        if (!append) {
            // Sync access handles write in place, so an overwrite is routed through a
            // temp file: a failed write then leaves the target untouched.
            return writeViaTempFile(filePath, tempHandle =>
                tryAsyncResult(() => writeDataViaSyncAccess(tempHandle, contents, false)),
            );
        }

        // Appending has to keep the existing content and stays in place
        return tryAsyncResult(() => writeDataViaSyncAccess(fileHandle, contents, true));
    }

    // Main thread fallback: createWritable already writes a swap file
    return tryAsyncResult(() => writeDataViaWritable(fileHandle, contents, append));
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
 * @see {@link writeFile} for general file writing
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
export async function openWritableFileStream(
    filePath: string,
    options?: WriteOptions,
): AsyncIOResult<FileSystemWritableFileStream> {
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
function getWriteFileHandle(
    filePath: string,
    options?: WriteOptions,
): AsyncIOResult<FileSystemFileHandle> {
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
 * Whether the handle supports the worker-only synchronous access API.
 * Only available inside a Worker, where it is also the preferred (in-place) writer.
 */
function isSyncAccessHandleSupported(fileHandle: FileSystemFileHandle): boolean {
    return typeof fileHandle.createSyncAccessHandle === 'function';
}

/**
 * Writes a ReadableStream to a file.
 *
 * Strategy:
 * - The worker's sync access handle writes in place, so an overwrite is routed through a
 *   temp file that is moved into place: an interrupted stream then leaves the target
 *   untouched instead of truncated. Appending keeps the existing content and writes in place.
 * - The main thread's `createWritable` already writes a swap file, so the target survives
 *   an interruption either way.
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

    if (existHandleRes.isErr()) {
        // File doesn't exist or unexpected error - return error if not creating or not a NotFoundError
        if (!create || !isNotFoundError(existHandleRes.unwrapErr())) {
            return existHandleRes.asErr();
        }

        // New file: a failed stream must not leave a partial file behind
        return writeViaTempFile(filePath, tempHandle =>
            writeStreamToHandle(tempHandle, stream, false),
        );
    }

    const fileHandle = existHandleRes.unwrap();

    // In-place writers cannot roll back, so overwriting goes through a temp file
    if (!append && isSyncAccessHandleSupported(fileHandle)) {
        return writeViaTempFile(filePath, tempHandle =>
            writeStreamToHandle(tempHandle, stream, false),
        );
    }

    return writeStreamToHandle(fileHandle, stream, append);
}

/**
 * Writes through a temporary file in `/tmp` and moves it into place, so a failed write
 * cannot damage the target: the destination keeps its previous content until the move.
 *
 * The move is a rename (metadata only), so the extra cost does not grow with the content
 * size. Used by the in-place writers - sync access handles have no swap file to roll back.
 *
 * Assumes filePath is already validated.
 *
 * @param filePath - The destination absolute path.
 * @param writeToTemp - Writes the content to the provided temp file handle.
 * @returns A promise that resolves to an `AsyncVoidIOResult` indicating success or failure.
 */
async function writeViaTempFile(
    filePath: string,
    writeToTemp: (tempHandle: FileSystemFileHandle) => AsyncVoidIOResult,
): AsyncVoidIOResult {
    const tempPath = generateTempPath();
    const tempHandleRes = await getFileHandle(tempPath, { create: true });
    if (tempHandleRes.isErr()) {
        return tempHandleRes.asErr();
    }

    const tempHandle = tempHandleRes.unwrap();
    const writeRes = await writeToTemp(tempHandle);

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
        if (isSyncAccessHandleSupported(fileHandle)) {
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
 *
 * This writes in place (there is no swap file), so callers that must not leave a
 * truncated file behind route overwrites through {@link writeViaTempFile}; appending
 * is always in place.
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
 *
 * Like {@link writeStreamViaSyncAccess} this writes in place, so overwrites are routed
 * through {@link writeViaTempFile} by the caller.
 */
async function writeDataViaSyncAccess(
    fileHandle: FileSystemFileHandle,
    contents: Exclude<WriteFileContent, ReadableStream>,
    append: boolean,
): Promise<void> {
    const accessHandle = await fileHandle.createSyncAccessHandle();

    try {
        // Always write as Uint8Array to avoid copying buffer.
        // Blob must be handled separately (readBlobBytesSync) before toBytesView,
        // since toBytesView does not accept Blob.
        const bytes =
            contents instanceof Blob ? readBlobBytesSync(contents) : toBytesView(contents);

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
