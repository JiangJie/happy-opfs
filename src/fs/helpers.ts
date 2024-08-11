import { SEPARATOR, basename, dirname } from '@std/path/posix';
import { Err, Ok, type AsyncIOResult } from 'happy-rusty';
import { CURRENT_DIR, NOT_FOUND_ERROR, ROOT_DIR } from './constants.ts';

/**
 * The root directory handle of the file system.
 */
let fsRoot: FileSystemDirectoryHandle;

/**
 * Retrieves the root directory handle of the file system.
 *
 * @returns A promise that resolves to the `FileSystemDirectoryHandle` of the root directory.
 */
async function getFsRoot(): Promise<FileSystemDirectoryHandle> {
    fsRoot ??= await navigator.storage.getDirectory();
    return fsRoot;
}

/**
 * Checks if the provided path is the root directory path.
 *
 * @param path - The path to check.
 * @returns A boolean indicating whether the path is the root directory path.
 */
export function isRootPath(path: string): boolean {
    return path === ROOT_DIR;
}

/**
 * Checks if the provided directory path is the current directory.
 *
 * @param dirPath - The directory path to check.
 * @returns A boolean indicating whether the directory path is the current directory.
 */
export function isCurrentDir(dirPath: string): boolean {
    return dirPath === CURRENT_DIR;
}

/**
 * Asynchronously obtains a handle to a child directory from the given parent directory handle.
 *
 * @param dirHandle - The handle to the parent directory.
 * @param dirName - The name of the child directory to retrieve.
 * @param options - Optional parameters that specify options such as whether to create the directory if it does not exist.
 * @returns A promise that resolves to an `AsyncIOResult` containing the `FileSystemDirectoryHandle` for the child directory.
 */
async function getChildDirHandle(dirHandle: FileSystemDirectoryHandle, dirName: string, options?: FileSystemGetDirectoryOptions): AsyncIOResult<FileSystemDirectoryHandle> {
    try {
        const handle = await dirHandle.getDirectoryHandle(dirName, options);

        return Ok(handle);
    } catch (e) {
        const err = e as DOMException;
        const error = new Error(`${ err.name }: ${ err.message } When get child directory '${ dirName }' from directory '${ dirHandle.name || ROOT_DIR }'.`);
        error.name = err.name;

        return Err(error);
    }
}

/**
 * Retrieves a file handle for a child file within a directory.
 *
 * @param dirHandle - The directory handle to search within.
 * @param fileName - The name of the file to retrieve.
 * @param options - Optional parameters for getting the file handle.
 * @returns A promise that resolves to an `AsyncIOResult` containing the `FileSystemFileHandle`.
 */
async function getChildFileHandle(dirHandle: FileSystemDirectoryHandle, fileName: string, options?: FileSystemGetFileOptions): AsyncIOResult<FileSystemFileHandle> {
    try {
        const handle = await dirHandle.getFileHandle(fileName, options);

        return Ok(handle);
    } catch (e) {
        const err = e as DOMException;
        const error = new Error(`${ err.name }: ${ err.message } When get child file '${ fileName }' from directory '${ dirHandle.name || ROOT_DIR }'.`);
        error.name = err.name;

        return Err(error);
    }
}

/**
 * Retrieves a directory handle given a path.
 *
 * @param dirPath - The path of the directory to retrieve.
 * @param options - Optional parameters for getting the directory handle.
 * @returns A promise that resolves to an `AsyncIOResult` containing the `FileSystemDirectoryHandle`.
 */
export async function getDirHandle(dirPath: string, options?: FileSystemGetDirectoryOptions): AsyncIOResult<FileSystemDirectoryHandle> {
    // create from root
    let dirHandle = await getFsRoot();

    if (isRootPath(dirPath)) {
        // root is already the a handle
        return Ok(dirHandle);
    }

    // start with /
    let childDirPath = dirPath.slice(1);

    while (childDirPath) {
        let dirName = '';
        const index = childDirPath.indexOf(SEPARATOR);

        if (index === -1) {
            dirName = childDirPath;
            childDirPath = '';
        } else {
            dirName = childDirPath.slice(0, index);
            childDirPath = childDirPath.slice(index + 1);

            // skip //
            if (index === 0) {
                continue;
            }
        }

        const dirHandleRes = await getChildDirHandle(dirHandle, dirName, options);
        if (dirHandleRes.isErr()) {
            // stop
            return dirHandleRes;
        }

        dirHandle = dirHandleRes.unwrap();
    }

    return Ok(dirHandle);
}

/**
 * Retrieves a file handle given a file path.
 *
 * @param filePath - The path of the file to retrieve.
 * @param options - Optional parameters for getting the file handle.
 * @returns A promise that resolves to an `AsyncIOResult` containing the `FileSystemFileHandle`.
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
 * Whether the error is a `NotFoundError`.
 * @param err - The error to check.
 * @returns `true` if the error is a `NotFoundError`, otherwise `false`.
 */
export function isNotFoundError(err: Error): boolean {
    return err.name === NOT_FOUND_ERROR;
}