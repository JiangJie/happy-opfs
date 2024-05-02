import { Err, Ok } from '@happy-js/happy-rusty';
import { SEPARATOR, basename, dirname } from '@std/path/posix';
import { CURRENT_DIR, ROOT_DIR } from './constants.ts';
import type { FsAsyncResult } from './defines.ts';

/**
 * cache the root directory handle
 */
let fsRoot: FileSystemDirectoryHandle;

/**
 * get cached root directory handle
 * @returns
 */
async function getFsRoot(): Promise<FileSystemDirectoryHandle> {
    fsRoot ??= await navigator.storage.getDirectory();
    return fsRoot;
}

/**
 * 是否支持OPFS
 * @returns true 如果支持
 */
export function isOPFSSupported(): boolean {
    return typeof navigator?.storage?.getDirectory === 'function';
}

/**
 * path是否是根路径
 * @param path
 * @returns
 */
export function isRootPath(path: string): boolean {
    return path === ROOT_DIR;
}

/**
 * 检查是否`.`
 * @param dirPath 通常是通过`dirname`返回的文件夹路径
 * @returns
 */
export function isCurrentDir(dirPath: string): boolean {
    return dirPath === CURRENT_DIR;
}

/**
 * 获取或者创建子目录
 * @param dirHandle
 * @param dirName 子目录名
 * @param options
 * @returns
 */
export async function getChildDirHandle(dirHandle: FileSystemDirectoryHandle, dirName: string, options?: FileSystemGetDirectoryOptions): FsAsyncResult<FileSystemDirectoryHandle> {
    const handle = await dirHandle.getDirectoryHandle(dirName, options).catch((err: DOMException) => {
        console.warn(`getChildDirHandle of ${ dirName } fail: ${ err.name }, ${ err.message }`);
        return err;
    });

    return handle instanceof FileSystemDirectoryHandle ? Ok(handle) : Err(handle as Error);
}

/**
 * 获取或者创建子文件
 * @param dirHandle
 * @param fileName
 * @param options
 * @returns
 */
export async function getChildFileHandle(dirHandle: FileSystemDirectoryHandle, fileName: string, options?: FileSystemGetFileOptions): FsAsyncResult<FileSystemFileHandle> {
    const handle = await dirHandle.getFileHandle(fileName, options).catch((err: DOMException) => {
        console.warn(`getChildFileHandle of ${ fileName } fail: ${ err.name }, ${ err.message }`);
        return err;
    });

    return handle instanceof FileSystemFileHandle ? Ok(handle) : Err(handle as Error);
}

/**
 * 根据路径获取文件夹handle
 * @param dirPath 文件夹路径
 * @param options
 * @returns
 */
export async function getDirHandle(dirPath: string, options?: FileSystemGetDirectoryOptions): FsAsyncResult<FileSystemDirectoryHandle> {
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
 * 根据路径获取文件handle
 * @param filePath 文件路径
 * @param options
 * @returns
 */
export async function getFileHandle(filePath: string, options?: FileSystemGetFileOptions): FsAsyncResult<FileSystemFileHandle> {
    const isCreate = options?.create ?? false;

    const dirPath = dirname(filePath);
    const fileName = basename(filePath);

    const dirHandle = await getDirHandle(dirPath, {
        create: isCreate,
    });
    if (dirHandle.isErr()) {
        // reuse err
        return dirHandle;
    }

    return getChildFileHandle(dirHandle.unwrap(), fileName, {
        create: isCreate,
    });
}