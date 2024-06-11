import { basename, dirname } from '@std/path/posix';
import { Err, Ok, type AsyncIOResult, type IOResult } from 'happy-rusty';
import { assertAbsolutePath } from './assertions.ts';
import { NOT_FOUND_ERROR } from './constants.ts';
import type { ReadFileContent, ReadOptions, WriteFileContent, WriteOptions } from './defines.ts';
import { getDirHandle, getFileHandle, isCurrentDir, isRootPath } from './helpers.ts';

/**
 * Creates a new directory at the specified path same as `mkdir -p`.
 *
 * @param dirPath - The path where the new directory will be created.
 * @returns A promise that resolves to an `AsyncIOResult` indicating whether the directory was successfully created.
 */
export async function mkdir(dirPath: string): AsyncIOResult<boolean> {
    assertAbsolutePath(dirPath);

    const dirHandle = await getDirHandle(dirPath, {
        create: true,
    });

    return dirHandle.isErr() ? (dirHandle as unknown as IOResult<boolean>) : Ok(true);
}

/**
 * Reads the contents of a directory at the specified path.
 *
 * @param dirPath - The path of the directory to read.
 * @returns A promise that resolves to an `AsyncIOResult` containing an async iterable iterator over the entries of the directory.
 */
export async function readDir(dirPath: string): AsyncIOResult<AsyncIterableIterator<[string, FileSystemHandle]>> {
    assertAbsolutePath(dirPath);

    const dirHandle = await getDirHandle(dirPath);

    return dirHandle.isErr() ? (dirHandle as unknown as IOResult<AsyncIterableIterator<[string, FileSystemHandle]>>) : Ok(dirHandle.unwrap().entries());
}

/**
 * Reads the content of a file at the specified path as an ArrayBuffer.
 *
 * @param filePath - The path of the file to read.
 * @param options - Read options specifying the 'binary' encoding.
 * @returns A promise that resolves to an `AsyncIOResult` containing the file content as an ArrayBuffer.
 */
export function readFile(filePath: string, options: ReadOptions & {
    encoding: 'binary';
}): AsyncIOResult<ArrayBuffer>;

/**
 * Reads the content of a file at the specified path as a Blob.
 *
 * @param filePath - The path of the file to read.
 * @param options - Read options specifying the 'blob' encoding.
 * @returns A promise that resolves to an `AsyncIOResult` containing the file content as a Blob.
 */
export function readFile(filePath: string, options: ReadOptions & {
    encoding: 'blob';
}): AsyncIOResult<Blob>;

/**
 * Reads the content of a file at the specified path as a string.
 *
 * @param filePath - The path of the file to read.
 * @param options - Read options specifying the 'utf8' encoding.
 * @returns A promise that resolves to an `AsyncIOResult` containing the file content as a string.
 */
export function readFile(filePath: string, options: ReadOptions & {
    encoding: 'utf8';
}): AsyncIOResult<string>;

/**
 * Reads the content of a file at the specified path as an ArrayBuffer by default.
 *
 * @param filePath - The path of the file to read.
 * @returns A promise that resolves to an `AsyncIOResult` containing the file content as an ArrayBuffer.
 */
export function readFile(filePath: string): AsyncIOResult<ArrayBuffer>;

/**
 * Reads the content of a file at the specified path with the specified options.
 *
 * @template T The type of the content to read from the file.
 * @param filePath - The path of the file to read.
 * @param options - Optional read options.
 * @returns A promise that resolves to an `AsyncIOResult` containing the file content.
 */
export async function readFile<T extends ReadFileContent>(filePath: string, options?: ReadOptions): AsyncIOResult<T> {
    assertAbsolutePath(filePath);

    const fileHandle = await getFileHandle(filePath);
    if (fileHandle.isErr()) {
        return fileHandle as unknown as IOResult<T>;
    }

    const file = await fileHandle.unwrap().getFile();
    switch (options?.encoding) {
        case 'blob': {
            return Ok(file as unknown as T);
        }
        case 'utf8': {
            const text = await file.text();
            return Ok(text as unknown as T);
        }
        default: {
            const data = await file.arrayBuffer();
            return Ok(data as unknown as T);
        }
    }
}

/**
 * Removes a file or directory at the specified path same as `rm -rf`.
 *
 * @param path - The path of the file or directory to remove.
 * @returns A promise that resolves to an `AsyncIOResult` indicating whether the file or directory was successfully removed.
 */
export async function remove(path: string): AsyncIOResult<boolean> {
    assertAbsolutePath(path);

    const dirPath = dirname(path);
    const childName = basename(path);

    const dirHandle = await getDirHandle(dirPath);
    if (dirHandle.isErr()) {
        return dirHandle as unknown as IOResult<boolean>;
    }

    // root
    if (isRootPath(dirPath) && isRootPath(childName)) {
        // TODO ts还不支持
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (dirHandle.unwrap() as any).remove({
            recursive: true,
        });
    } else {
        await dirHandle.unwrap().removeEntry(childName, {
            recursive: true,
        });
    }

    return Ok(true);
}

/**
 * Renames a file or directory from an old path to a new path.
 *
 * @param oldPath - The current path of the file or directory.
 * @param newPath - The new path of the file or directory.
 * @returns A promise that resolves to an `AsyncIOResult` indicating whether the file or directory was successfully renamed.
 */
export async function rename(oldPath: string, newPath: string): AsyncIOResult<boolean> {
    assertAbsolutePath(oldPath);

    const fileHandle = await getFileHandle(oldPath);
    if (fileHandle.isErr()) {
        return fileHandle as unknown as IOResult<boolean>;
    }

    const dirPath = dirname(oldPath);
    let newDirPath = dirname(newPath);
    // same dir
    if (isCurrentDir(newDirPath)) {
        newDirPath = dirPath;
    } else {
        // not same must be absolute
        assertAbsolutePath(newPath);
    }

    const newDirHandle = await getDirHandle(newDirPath);
    if (newDirHandle.isErr()) {
        return newDirHandle as unknown as IOResult<boolean>;
    }

    const newName = basename(newPath);
    // TODO ts还不支持
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (fileHandle.unwrap() as any).move(newDirHandle.unwrap(), newName);

    return Ok(true);
}

/**
 * Retrieves the status of a file or directory at the specified path.
 *
 * @param path - The path of the file or directory to retrieve status for.
 * @returns A promise that resolves to an `AsyncIOResult` containing the `FileSystemHandle`.
 */
export async function stat(path: string): AsyncIOResult<FileSystemHandle> {
    type T = FileSystemHandle;

    assertAbsolutePath(path);

    const dirPath = dirname(path);
    const dirHandle = await getDirHandle(dirPath);
    if (dirHandle.isErr()) {
        return dirHandle;
    }

    const childName = basename(path);
    if (!childName) {
        // root
        return dirHandle as unknown as IOResult<T>;
    }

    // 当前只有靠遍历检查
    for await (const [name, handle] of dirHandle.unwrap().entries()) {
        if (name === childName) {
            return Ok(handle);
        }
    }

    const err = new Error(`${ path } not found`);
    err.name = NOT_FOUND_ERROR;

    return Err(err);
}

/**
 * Writes content to a file at the specified path.
 *
 * @param filePath - The path of the file to write to.
 * @param contents - The content to write to the file.
 * @param options - Optional write options.
 * @returns A promise that resolves to an `AsyncIOResult` indicating whether the file was successfully written.
 */
export async function writeFile(filePath: string, contents: WriteFileContent, options?: WriteOptions): AsyncIOResult<boolean> {
    assertAbsolutePath(filePath);

    // 默认创建
    const { append = false, create = true } = options ?? {};

    const fileHandle = await getFileHandle(filePath, {
        create,
    });
    if (fileHandle.isErr()) {
        return fileHandle as unknown as IOResult<boolean>;
    }

    const writable = await fileHandle.unwrap().createWritable({
        keepExistingData: append,
    });
    const params: WriteParams = {
        type: 'write',
        data: contents,
    };

    // append?
    if (append) {
        const { size } = await fileHandle.unwrap().getFile();
        params.position = size;
    }

    await writable.write(params);
    await writable.close();

    return Ok(true);
}