import { SEPARATOR, basename, dirname } from '@std/path/posix';
import { Err, Ok, type AsyncIOResult } from 'happy-rusty';
import { CURRENT_DIR, ROOT_DIR } from './constants.ts';
import { NOT_FOUND_ERROR } from './defines.ts';

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
 * Checks if the Origin Private File System (OPFS) is supported in the current environment.
 *
 * @returns A boolean indicating whether OPFS is supported.
 */
export function isOPFSSupported(): boolean {
    return typeof navigator?.storage?.getDirectory === 'function';
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
export async function getChildDirHandle(dirHandle: FileSystemDirectoryHandle, dirName: string, options?: FileSystemGetDirectoryOptions): AsyncIOResult<FileSystemDirectoryHandle> {
    const handle = await dirHandle.getDirectoryHandle(dirName, options).catch((err: DOMException) => {
        const error = new Error(`getChildDirHandle of \`${ dirName }\` fail: ${ err.name }, ${ err.message }`);
        error.name = err.name;

        return error;
    });

    return handle instanceof FileSystemDirectoryHandle ? Ok(handle) : Err(handle);
}

/**
 * Retrieves a file handle for a child file within a directory.
 *
 * @param dirHandle - The directory handle to search within.
 * @param fileName - The name of the file to retrieve.
 * @param options - Optional parameters for getting the file handle.
 * @returns A promise that resolves to an `AsyncIOResult` containing the `FileSystemFileHandle`.
 */
export async function getChildFileHandle(dirHandle: FileSystemDirectoryHandle, fileName: string, options?: FileSystemGetFileOptions): AsyncIOResult<FileSystemFileHandle> {
    const handle = await dirHandle.getFileHandle(fileName, options).catch((err: DOMException) => {
        const error = new Error(`getChildFileHandle of \`${ fileName }\` fail: ${ err.name }, ${ err.message }`);
        error.name = err.name;

        return error;
    });

    return handle instanceof FileSystemFileHandle ? Ok(handle) : Err(handle);
}

/**
 * Retrieves a directory handle given a path.
 *
 * @param dirPath - The path of the directory to retrieve.
 * @param options - Optional parameters for getting the directory handle.
 * @returns A promise that resolves to an `AsyncIOResult` containing the `FileSystemDirectoryHandle`.
 */
export async function getDirHandle(dirPath: string, options?: FileSystemGetDirectoryOptions): AsyncIOResult<FileSystemDirectoryHandle> {
    // 从root开始向下创建
    let dirHandle = await getFsRoot();

    if (isRootPath(dirPath)) {
        // 根路径无需创建
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

            // 跳过//的情况
            if (index === 0) {
                continue;
            }
        }

        const handle = await getChildDirHandle(dirHandle, dirName, options);
        if (handle.isErr()) {
            // stop
            return handle;
        }

        dirHandle = handle.unwrap();
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

    const dirHandle = await getDirHandle(dirPath, {
        create: isCreate,
    });

    if (dirHandle.isErr()) {
        return dirHandle.asErr();
    }

    return getChildFileHandle(dirHandle.unwrap(), fileName, {
        create: isCreate,
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