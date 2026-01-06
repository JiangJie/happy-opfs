import { SEPARATOR, basename, dirname } from '@std/path/posix';
import { LazyAsync, Ok, RESULT_VOID, tryAsyncResult, type AsyncIOResult, type AsyncVoidIOResult } from 'happy-rusty';
import { ABORT_ERROR, NOT_FOUND_ERROR, ROOT_DIR } from './constants.ts';

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
 * @internal
 */
export function isRootDir(path: string): boolean {
    return path === ROOT_DIR;
}

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
 * @internal
 */
export async function getDirHandle(dirPath: string, options?: FileSystemGetDirectoryOptions): AsyncIOResult<FileSystemDirectoryHandle> {
    // Start from root
    let dirHandle = fsRoot.isInitialized()
        ? fsRoot.get().unwrap()
        : await fsRoot.force();

    if (isRootDir(dirPath)) {
        // Root is already a handle, no traversal needed
        return Ok(dirHandle);
    }

    // Iterate through each path segment
    // Path is already normalized by assertAbsolutePath, no empty segments
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
 * @internal
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
 * @internal
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
 * @internal
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
 * @internal
 */
export async function aggregateResults(tasks: AsyncVoidIOResult[]): AsyncVoidIOResult {
    const allRes = await Promise.all(tasks);
    return allRes.find(x => x.isErr()) ?? RESULT_VOID;
}

/**
 * Creates an `AbortError` instance.
 * Used to signal that an operation was aborted.
 *
 * @returns An `Error` object with the name set to `'AbortError'`.
 * @internal
 */
export function createAbortError(): Error {
    const error = new Error('Operation was aborted');
    error.name = ABORT_ERROR;

    return error;
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
 * @internal
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
