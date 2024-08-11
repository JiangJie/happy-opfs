import { basename, dirname, join } from '@std/path/posix';
import { Err, Ok, RESULT_VOID, type AsyncIOResult, type AsyncVoidIOResult } from 'happy-rusty';
import { assertAbsolutePath } from './assertions.ts';
import { NOT_FOUND_ERROR } from './constants.ts';
import type { ReadDirEntry, ReadDirOptions, ReadFileContent, ReadOptions, WriteFileContent, WriteOptions } from './defines.ts';
import { getDirHandle, getFileHandle, isCurrentDir, isNotFoundError, isRootPath } from './helpers.ts';
import { isDirectoryHandle } from './utils.ts';

/**
 * Creates a new file at the specified path same as `touch`.
 *
 * @param filePath - The path of the file to create.
 * @returns A promise that resolves to an `AsyncIOResult` indicating whether the file was successfully created.
 */
export async function createFile(filePath: string): AsyncVoidIOResult {
    assertAbsolutePath(filePath);

    const fileHandleRes = await getFileHandle(filePath, {
        create: true,
    });

    return fileHandleRes.and(RESULT_VOID);
}

/**
 * Creates a new directory at the specified path same as `mkdir -p`.
 *
 * @param dirPath - The path where the new directory will be created.
 * @returns A promise that resolves to an `AsyncIOResult` indicating whether the directory was successfully created.
 */
export async function mkdir(dirPath: string): AsyncVoidIOResult {
    assertAbsolutePath(dirPath);

    const dirHandleRes = await getDirHandle(dirPath, {
        create: true,
    });

    return dirHandleRes.and(RESULT_VOID);
}

/**
 * Reads the contents of a directory at the specified path.
 *
 * @param dirPath - The path of the directory to read.
 * @param options - Options of readdir.
 * @returns A promise that resolves to an `AsyncIOResult` containing an async iterable iterator over the entries of the directory.
 */
export async function readDir(dirPath: string, options?: ReadDirOptions): AsyncIOResult<AsyncIterableIterator<ReadDirEntry>> {
    assertAbsolutePath(dirPath);

    const dirHandleRes = await getDirHandle(dirPath);

    async function* read(dirHandle: FileSystemDirectoryHandle, subDirPath: string): AsyncIterableIterator<ReadDirEntry> {
        const entries = dirHandle.entries();

        for await (const [name, handle] of entries) {
            // relative path from `dirPath`
            const path = subDirPath === dirPath ? name : join(subDirPath, name);
            yield {
                path,
                handle,
            };

            if (isDirectoryHandle(handle) && options?.recursive) {
                yield* read(await dirHandle.getDirectoryHandle(name), path);
            }
        }
    }

    return dirHandleRes.andThen(x => Ok(read(x, dirPath)));
}

/**
 * Reads the content of a file at the specified path as a File.
 *
 * @param filePath - The path of the file to read.
 * @param options - Read options specifying the 'blob' encoding.
 * @returns A promise that resolves to an `AsyncIOResult` containing the file content as a File.
 */
export function readFile(filePath: string, options: ReadOptions & {
    encoding: 'blob';
}): AsyncIOResult<File>;

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
 * @param options - Read options specifying the 'binary' encoding.
 * @returns A promise that resolves to an `AsyncIOResult` containing the file content as an ArrayBuffer.
 */
export function readFile(filePath: string, options?: ReadOptions & {
    encoding: 'binary';
}): AsyncIOResult<ArrayBuffer>;

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

    const fileHandleRes = await getFileHandle(filePath);

    return fileHandleRes.andThenAsync(async fileHandle => {
        const file = await fileHandle.getFile();
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
    });
}

/**
 * Removes a file or directory at the specified path same as `rm -rf`.
 *
 * @param path - The path of the file or directory to remove.
 * @returns A promise that resolves to an `AsyncIOResult` indicating whether the file or directory was successfully removed.
 */
export async function remove(path: string): AsyncVoidIOResult {
    assertAbsolutePath(path);

    const dirPath = dirname(path);
    const childName = basename(path);

    const dirHandleRes = await getDirHandle(dirPath);

    return (await dirHandleRes.andThenAsync(async (dirHandle): AsyncVoidIOResult => {
        try {
            // root
            if (isRootPath(dirPath) && isRootPath(childName)) {
                // TODO ts not support yet
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                await (dirHandle as any).remove({
                    recursive: true,
                });
            } else {
                await dirHandle.removeEntry(childName, {
                    recursive: true,
                });
            }
        } catch (e) {
            return Err(e as DOMException);
        }

        return RESULT_VOID;
    })).orElse<Error>(err => {
        // not found as success
        return isNotFoundError(err) ? RESULT_VOID : Err(err);
    });
}

/**
 * Renames a file or directory from an old path to a new path.
 *
 * @param oldPath - The current path of the file or directory.
 * @param newPath - The new path of the file or directory.
 * @returns A promise that resolves to an `AsyncIOResult` indicating whether the file or directory was successfully renamed.
 */
export async function rename(oldPath: string, newPath: string): AsyncVoidIOResult {
    assertAbsolutePath(oldPath);

    const fileHandleRes = await getFileHandle(oldPath);

    return fileHandleRes.andThenAsync(async (fileHandle) => {
        const dirPath = dirname(oldPath);
        let newDirPath = dirname(newPath);
        // same dir
        if (isCurrentDir(newDirPath)) {
            newDirPath = dirPath;
        } else {
            // not same must be absolute
            assertAbsolutePath(newPath);
        }

        const newDirHandleRes = await getDirHandle(newDirPath);
        return newDirHandleRes.andThenAsync(async newDirHandle => {
            const newName = basename(newPath);
            try {
                // TODO ts not support yet
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                await (fileHandle as any).move(newDirHandle, newName);
                return RESULT_VOID;
            } catch (e) {
                return Err(e as DOMException);
            }
        });
    });
}

/**
 * Retrieves the status of a file or directory at the specified path.
 *
 * @param path - The path of the file or directory to retrieve status for.
 * @returns A promise that resolves to an `AsyncIOResult` containing the `FileSystemHandle`.
 */
export async function stat(path: string): AsyncIOResult<FileSystemHandle> {
    assertAbsolutePath(path);

    const dirPath = dirname(path);
    const childName = basename(path);

    const dirHandleRes = await getDirHandle(dirPath);
    if (!childName) {
        // root
        return dirHandleRes;
    }

    return dirHandleRes.andThenAsync(async dirHandle => {
        // currently only rely on traversal inspection
        for await (const [name, handle] of dirHandle.entries()) {
            if (name === childName) {
                return Ok(handle);
            }
        }

        const err = new Error(`${ NOT_FOUND_ERROR }: '${ childName }' does not exist. Full path is '${ path }'.`);
        err.name = NOT_FOUND_ERROR;

        return Err(err);
    });
}

/**
 * Writes content to a file at the specified path.
 *
 * @param filePath - The path of the file to write to.
 * @param contents - The content to write to the file.
 * @param options - Optional write options.
 * @returns A promise that resolves to an `AsyncIOResult` indicating whether the file was successfully written.
 */
export async function writeFile(filePath: string, contents: WriteFileContent, options?: WriteOptions): AsyncVoidIOResult {
    assertAbsolutePath(filePath);

    // create as default
    const { append = false, create = true } = options ?? {};

    const fileHandleRes = await getFileHandle(filePath, {
        create,
    });

    return fileHandleRes.andThenAsync(async fileHandle => {
        const writable = await fileHandle.createWritable({
            keepExistingData: append,
        });
        const params: WriteParams = {
            type: 'write',
            data: contents,
        };

        // append?
        if (append) {
            const { size } = await fileHandle.getFile();
            params.position = size;
        }

        await writable.write(params);
        await writable.close();

        return RESULT_VOID;
    });
}