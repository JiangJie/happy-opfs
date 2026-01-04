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
export function isRootPath(path: string): boolean {
    return path === ROOT_DIR;
}

/**
 * Asynchronously obtains a handle to a child directory from the given parent directory handle.
 *
 * @param dirHandle - The handle to the parent directory.
 * @param dirName - The name of the child directory to retrieve.
 * @param options - Optional parameters (e.g., `{ create: true }` to create if not exists).
 * @returns A promise that resolves to an `AsyncIOResult` containing the `FileSystemDirectoryHandle`.
 */
async function getChildDirHandle(dirHandle: FileSystemDirectoryHandle, dirName: string, options?: FileSystemGetDirectoryOptions): AsyncIOResult<FileSystemDirectoryHandle> {
    return (await tryAsyncResult(dirHandle.getDirectoryHandle(dirName, options)))
        .mapErr(err => {
            const error = new Error(`${ err.name }: ${ err.message } When get child directory '${ dirName }' from directory '${ dirHandle.name || ROOT_DIR }'`);
            error.name = err.name;
            return error;
        });
}

/**
 * Retrieves a file handle for a child file within a directory.
 *
 * @param dirHandle - The directory handle to search within.
 * @param fileName - The name of the file to retrieve.
 * @param options - Optional parameters (e.g., `{ create: true }` to create if not exists).
 * @returns A promise that resolves to an `AsyncIOResult` containing the `FileSystemFileHandle`.
 */
async function getChildFileHandle(dirHandle: FileSystemDirectoryHandle, fileName: string, options?: FileSystemGetFileOptions): AsyncIOResult<FileSystemFileHandle> {
    return (await tryAsyncResult(dirHandle.getFileHandle(fileName, options)))
        .mapErr(err => {
            const error = new Error(`${ err.name }: ${ err.message } When get child file '${ fileName }' from directory '${ dirHandle.name || ROOT_DIR }'`);
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

    if (isRootPath(dirPath)) {
        // Root is already a handle, no traversal needed
        return Ok(dirHandle);
    }

    // Remove leading '/' and start traversing
    let childDirPath = dirPath.slice(1);

    // Iterate through each path segment
    while (childDirPath) {
        let dirName = '';
        const index = childDirPath.indexOf(SEPARATOR);

        if (index === -1) {
            // Last segment
            dirName = childDirPath;
            childDirPath = '';
        } else {
            // Extract current segment and remaining path
            dirName = childDirPath.slice(0, index);
            childDirPath = childDirPath.slice(index + 1);

            // Skip empty segments (handles '//' in path)
            if (index === 0) {
                continue;
            }
        }

        // Get or create child directory
        const dirHandleRes = await getChildDirHandle(dirHandle, dirName, options);
        if (dirHandleRes.isErr()) {
            // Stop traversal on error
            return dirHandleRes;
        }

        dirHandle = dirHandleRes.unwrap();
    }

    return Ok(dirHandle);
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
    const isCreate = options?.create ?? false;

    const dirPath = dirname(filePath);
    const fileName = basename(filePath);

    const dirHandleRes = await getDirHandle(dirPath, {
        create: isCreate,
    });

    return dirHandleRes.andThenAsync(dirHandle => {
        return getChildFileHandle(dirHandle, fileName, {
            create: isCreate,
        });
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
 * Returns the first error encountered, or a void success result if all tasks succeed.
 *
 * @param tasks - The list of async void I/O result promises to aggregate.
 * @returns A promise that resolves to the first error result, or `RESULT_VOID` if all tasks succeed.
 * @internal
 */
export async function getFinalResult(tasks: AsyncVoidIOResult[]): AsyncVoidIOResult {
    const allRes = await Promise.all(tasks);
    // Return the first error if any task failed
    const fail = allRes.find(x => x.isErr());

    return fail ?? RESULT_VOID;
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
 * Reads the binary data from a file handle.
 *
 * @param handle - The `FileSystemFileHandle` to read from.
 * @returns A promise that resolves to an `AsyncIOResult` containing the file content as a `Uint8Array`.
 * @internal
 */
export function getFileDataByHandle(handle: FileSystemFileHandle): AsyncIOResult<Uint8Array> {
    return tryAsyncResult(async () => {
        const file = await handle.getFile();
        const ab = await file.arrayBuffer();
        return new Uint8Array(ab);
    });
}