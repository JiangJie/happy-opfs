/**
 * Internal helper utilities for async file operations.
 * These functions are not exported publicly.
 *
 * @internal
 * @module
 */

import type { FetchTask } from '@happy-ts/fetch-t';
import { basename, dirname, SEPARATOR } from '@std/path/posix';
import { LazyAsync, Ok, RESULT_VOID, tryAsyncResult, type AsyncIOResult, type AsyncVoidIOResult, type IOResult } from 'happy-rusty';
import { ABORT_ERROR, EMPTY_BODY_ERROR, EMPTY_FILE_ERROR, NOT_FOUND_ERROR, NOTHING_TO_ZIP_ERROR, ROOT_DIR } from '../../shared/mod.ts';

/**
 * Lazily initialized root directory handle of the file system.
 * Created on first access via `force()`.
 */
const fsRoot = LazyAsync(() => navigator.storage.getDirectory());

/**
 * Checks if the provided path is the root directory path.
 *
 * @param path - The path to check.
 * @returns `true` if the path equals `'/'`, otherwise `false`.
 */
export function isRootDir(path: string): boolean {
    return path === ROOT_DIR;
}

/**
 * Retrieves a directory handle by traversing the path from root.
 *
 * Algorithm:
 * 1. Start from the OPFS root directory
 * 2. If path is `/`, return root immediately
 * 3. Split path by `/` separator and iterate through each segment
 * 4. For each segment, get or create the child directory handle
 * 5. Return error immediately if any segment fails
 *
 * @param dirPath - The absolute path of the directory to retrieve.
 * @param options - Optional parameters (e.g., `{ create: true }` to create intermediate directories).
 * @returns A promise that resolves to an `AsyncIOResult` containing the `FileSystemDirectoryHandle`.
 */
export async function getDirHandle(dirPath: string, options?: FileSystemGetDirectoryOptions): AsyncIOResult<FileSystemDirectoryHandle> {
    // Start from root
    let dirHandle = fsRoot.isInitialized()
        ? fsRoot.get().unwrap()
        : await fsRoot.force();

    if (isRootDir(dirPath)) {
        // Root is already a handle, no traversal needed
        return Ok(dirHandle);
    } else {
        // NOTE: Empty else branch is intentional to fix V8 coverage tracking.
        // Without explicit else, V8 incorrectly marks code after early return as uncovered.
    }

    // Traverse path from root
    // Iterate through each path segment
    // Path is already normalized by validateAbsolutePath, no empty segments
    // Remove leading '/' and start traversing
    for (const childDirName of dirPath.slice(1).split(SEPARATOR)) {
        // Get or create child directory
        const dirHandleRes = await getChildDirHandle(dirHandle, childDirName, options);
        if (dirHandleRes.isErr()) {
            // Stop traversal on error
            return dirHandleRes;
        }

        dirHandle = dirHandleRes.unwrap();
    }

    return Ok(dirHandle);
}

/**
 * Gets the directory handle for the parent directory of the given path.
 *
 * @param path - The absolute path whose parent directory handle is to be retrieved.
 * @param options - Optional parameters (e.g., `{ create: true }` to create intermediate directories).
 * @returns A promise that resolves to an `AsyncIOResult` containing the parent `FileSystemDirectoryHandle`.
 */
export function getParentDirHandle(path: string, options?: FileSystemGetDirectoryOptions): AsyncIOResult<FileSystemDirectoryHandle> {
    return getDirHandle(dirname(path), options);
}

/**
 * Retrieves a file handle given a file path.
 *
 * @param filePath - The absolute path of the file to retrieve.
 * @param options - Optional parameters (e.g., `{ create: true }` to create the file if not exists).
 * @returns A promise that resolves to an `AsyncIOResult` containing the `FileSystemFileHandle`.
 */
export async function getFileHandle(filePath: string, options?: FileSystemGetFileOptions): AsyncIOResult<FileSystemFileHandle> {
    const dirHandleRes = await getParentDirHandle(filePath, options);

    return dirHandleRes.andThenAsync(dirHandle => {
        const fileName = basename(filePath);
        return getChildFileHandle(dirHandle, fileName, options);
    });
}

/**
 * Checks whether the error is a `NotFoundError`.
 *
 * @param err - The error to check.
 * @returns `true` if the error's name is `'NotFoundError'`, otherwise `false`.
 */
export function isNotFoundError(err: Error): boolean {
    return err.name === NOT_FOUND_ERROR;
}

/**
 * Aggregates multiple async void I/O results into a single result.
 * Waits for all tasks to complete, then returns the first error encountered,
 * or a void success result if all tasks succeed.
 *
 * @param tasks - The list of async void I/O result promises to aggregate.
 * @returns A promise that resolves to the first error result, or `RESULT_VOID` if all tasks succeed.
 */
export async function aggregateResults(tasks: AsyncVoidIOResult[]): AsyncVoidIOResult {
    if (tasks.length === 0) {
        return RESULT_VOID;
    }

    const allRes = await Promise.all(tasks);
    return allRes.find(x => x.isErr()) ?? RESULT_VOID;
}

/**
 * Creates an `AbortError` instance.
 * Used to signal that an operation was aborted.
 *
 * @returns An `Error` object with the name set to `'AbortError'`.
 */
export function createAbortError(): Error {
    const error = new Error('Operation was aborted');
    error.name = ABORT_ERROR;

    return error;
}

/**
 * Creates an `EmptyBodyError` instance.
 * Used to signal that a response body is empty (null).
 *
 * @returns An `Error` object with the name set to `'EmptyBodyError'`.
 */
export function createEmptyBodyError(): Error {
    const error = new Error('Response body is empty');
    error.name = EMPTY_BODY_ERROR;

    return error;
}

/**
 * Creates an `EmptyFileError` instance.
 * Used to signal that a file content is empty (0 bytes).
 *
 * @returns An `Error` object with the name set to `'EmptyFileError'`.
 */
export function createEmptyFileError(): Error {
    const error = new Error('File content is empty');
    error.name = EMPTY_FILE_ERROR;

    return error;
}

/**
 * Creates a `NothingToZipError` instance.
 * Used when attempting to zip an empty directory with preserveRoot=false.
 *
 * @returns An `Error` object with the name set to `'NothingToZipError'`.
 */
export function createNothingToZipError(): Error {
    const error = new Error('Nothing to zip');
    error.name = NOTHING_TO_ZIP_ERROR;

    return error;
}

/**
 * Creates a failed FetchTask that immediately resolves with an error.
 * Used when validation fails before making the actual fetch request.
 *
 * @param errResult - The error result to return.
 * @returns A FetchTask that resolves with the error.
 */
export function createFailedFetchTask<T>(errResult: IOResult<unknown>): FetchTask<T> {
    return {
        abort(): void { /* noop */ },
        get aborted(): boolean { return false; },
        get result() { return Promise.resolve(errResult.asErr<T>()); },
    };
}

/**
 * Marks all parent directories of a path as non-empty.
 * Used to optimize directory creation by skipping directories that will be
 * implicitly created when writing files.
 *
 * @param path - The relative file path.
 * @param nonEmptyDirs - Set to track non-empty directories.
 */
export function markParentDirsNonEmpty(
    path: string,
    nonEmptyDirs: Set<string>,
): void {
    let slashIndex = path.lastIndexOf(SEPARATOR);
    while (slashIndex > 0) {
        const parent = path.slice(0, slashIndex);
        if (nonEmptyDirs.has(parent)) break;
        nonEmptyDirs.add(parent);
        slashIndex = path.lastIndexOf(SEPARATOR, slashIndex - 1);
    }
}

/**
 * Extended FileSystemHandle interface with optional remove method.
 * The remove() method is not supported in Firefox/iOS Safari.
 */
interface RemovableHandle extends FileSystemHandle {
    remove?(options?: FileSystemRemoveOptions): Promise<void>;
}

/**
 * Removes a file or directory with cross-browser compatibility.
 * Accepts either a handle or a name string. When a handle is provided and
 * `handle.remove()` is supported (Chrome/Edge), uses native removal.
 * Otherwise falls back to `parentDirHandle.removeEntry()`.
 *
 * For root directory removal on Firefox/Safari (where `handle.remove()` is not supported),
 * iterates through all children and removes them individually.
 *
 * @param handleOrName - The handle to remove, or the name of the entry.
 * @param parentDirHandle - The parent directory handle.
 * @param options - Optional remove options (e.g., `{ recursive: true }`).
 * @returns A promise that resolves when the entry is removed.
 */
export async function removeHandle(
    handleOrName: FileSystemHandle | string,
    parentDirHandle: FileSystemDirectoryHandle,
    options?: FileSystemRemoveOptions,
): Promise<void> {
    if (typeof handleOrName === 'string') {
        // Name string: use removeEntry directly
        return parentDirHandle.removeEntry(handleOrName, options);
    }

    const removableHandle = handleOrName as RemovableHandle;

    if (typeof removableHandle.remove === 'function') {
        // Chrome/Edge: use native handle.remove()
        return removableHandle.remove(options);
    }

    // Firefox/Safari: fallback to removeEntry()
    // Special case: root directory has empty name, cannot use removeEntry
    // Instead, iterate and remove all children
    if (!handleOrName.name) {
        const dirHandle = handleOrName as FileSystemDirectoryHandle;
        const tasks: Promise<void>[] = [];

        for await (const childName of dirHandle.keys()) {
            tasks.push(dirHandle.removeEntry(childName, options));
        }

        if (tasks.length > 0) {
            await Promise.all(tasks);
        }
    } else {
        return parentDirHandle.removeEntry(handleOrName.name, options);
    }
}

// #region Internal Helper Functions

/**
 * Asynchronously obtains a handle to a child directory from the given parent directory handle.
 *
 * @param dirHandle - The handle to the parent directory.
 * @param childDirName - The name of the child directory to retrieve.
 * @param options - Optional parameters (e.g., `{ create: true }` to create if not exists).
 * @returns A promise that resolves to an `AsyncIOResult` containing the `FileSystemDirectoryHandle`.
 */
async function getChildDirHandle(dirHandle: FileSystemDirectoryHandle, childDirName: string, options?: FileSystemGetDirectoryOptions): AsyncIOResult<FileSystemDirectoryHandle> {
    const handleRes = await tryAsyncResult<FileSystemDirectoryHandle, DOMException>(dirHandle.getDirectoryHandle(childDirName, options));
    return handleRes.mapErr(err => {
        const error = new Error(`${ err.name }: ${ err.message } When get child directory '${ childDirName }' from directory '${ dirHandle.name || ROOT_DIR }'`);
        error.name = err.name;
        return error;
    });
}

/**
 * Retrieves a file handle for a child file within a directory.
 *
 * @param dirHandle - The directory handle to search within.
 * @param childFileName - The name of the file to retrieve.
 * @param options - Optional parameters (e.g., `{ create: true }` to create if not exists).
 * @returns A promise that resolves to an `AsyncIOResult` containing the `FileSystemFileHandle`.
 */
async function getChildFileHandle(dirHandle: FileSystemDirectoryHandle, childFileName: string, options?: FileSystemGetFileOptions): AsyncIOResult<FileSystemFileHandle> {
    const handleRes = await tryAsyncResult<FileSystemFileHandle, DOMException>(dirHandle.getFileHandle(childFileName, options));
    return handleRes.mapErr(err => {
        const error = new Error(`${ err.name }: ${ err.message } When get child file '${ childFileName }' from directory '${ dirHandle.name || ROOT_DIR }'`);
        error.name = err.name;
        return error;
    });
}

/**
 * Result of peeking a stream's first chunk.
 */
export interface PeekStreamResult<T> {
    /** Whether the stream is empty (no data). */
    isEmpty: boolean;
    /** The reconstructed stream with first chunk prepended. Only valid if not empty. */
    stream: ReadableStream<T>;
}

/**
 * Peeks the first chunk of a ReadableStream to check if it's empty.
 * Returns the original stream reconstructed with the peeked chunk prepended.
 *
 * This enables true streaming while detecting empty streams before processing.
 *
 * @param source - The source ReadableStream to peek.
 * @returns A promise resolving to an `AsyncIOResult` containing PeekStreamResult with isEmpty flag and reconstructed stream.
 */
export async function peekStream<T>(source: ReadableStream<T>): AsyncIOResult<PeekStreamResult<T>> {
    const reader = source.getReader();

    const firstRes = await tryAsyncResult(reader.read());
    if (firstRes.isErr()) {
        reader.releaseLock();
        return firstRes.asErr();
    }

    const first = firstRes.unwrap();

    if (first.done) {
        reader.releaseLock();
        // Return a new empty stream since the original is already consumed
        return Ok({
            isEmpty: true,
            stream: new ReadableStream<T>({
                start(controller) {
                    controller.close();
                },
            }),
        });
    }

    // Reconstruct stream: first chunk + remaining data
    const stream = new ReadableStream<T>({
        async start(controller) {
            controller.enqueue(first.value);
        },
        async pull(controller) {
            try {
                const { done, value } = await reader.read();
                if (done) {
                    reader.releaseLock();
                    controller.close();
                } else {
                    controller.enqueue(value);
                }
            } catch (err) {
                reader.releaseLock();
                controller.error(err);
            }
        },
        async cancel(reason) {
            try {
                await reader.cancel(reason);
            } finally {
                reader.releaseLock();
            }
        },
    });

    return Ok({
        isEmpty: false,
        stream,
    });
}

/**
 * Extended FileSystemHandle interface with move method.
 * The move() method is not yet in TypeScript's lib.dom.d.ts.
 * @see https://github.com/mdn/browser-compat-data/issues/20341
 */
interface MovableHandle extends FileSystemHandle {
    move(destination: FileSystemDirectoryHandle, name: string): Promise<void>;
}

/**
 * Moves a file handle to a new path, creating parent directories if needed.
 * This is a higher-level operation that handles path resolution and directory creation.
 *
 * @param fileHandle - The file handle to move.
 * @param destFilePath - The destination absolute file path.
 * @returns A promise that resolves to an `AsyncVoidIOResult` indicating success or failure.
 */
export async function moveFileHandle(fileHandle: FileSystemFileHandle, destFilePath: string): AsyncVoidIOResult {
    const dirRes = await getParentDirHandle(destFilePath, {
        create: true,
    });

    return dirRes.andTryAsync(destDirHandle => {
        const destName = basename(destFilePath);
        return (fileHandle as unknown as MovableHandle).move(destDirHandle, destName);
    });
}

// #endregion
