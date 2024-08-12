import { basename, dirname, join } from '@std/path/posix';
import { Err, Ok, RESULT_FALSE, RESULT_VOID, type AsyncIOResult, type AsyncVoidIOResult, type IOResult } from 'happy-rusty';
import invariant from 'tiny-invariant';
import { assertAbsolutePath } from './assertions.ts';
import type { CopyOptions, ExistsOptions, MoveOptions, WriteFileContent } from './defines.ts';
import { getDirHandle, isNotFoundError } from './helpers.ts';
import { mkdir, readDir, readFile, remove, stat, writeFile } from './opfs_core.ts';
import { isDirectoryHandle, isFileHandle } from './utils.ts';

/**
 * Appends content to a file at the specified path.
 *
 * @param filePath - The path of the file to append to.
 * @param contents - The content to append to the file.
 * @returns A promise that resolves to an `AsyncIOResult` indicating whether the content was successfully appended.
 */
export function appendFile(filePath: string, contents: WriteFileContent): AsyncVoidIOResult {
    return writeFile(filePath, contents, {
        append: true,
    });
}

/**
 * Copies a file or directory from one location to another same as `cp -r`.
 *
 * Both `srcPath` and `destPath` must both be a file or directory.
 *
 * @param srcPath - The source file/directory path.
 * @param destPath - The destination file/directory path.
 * @param options - The copy options.
 * @returns A promise that resolves to an `AsyncVoidIOResult` indicating whether the file was successfully copied.
 */
export async function copy(srcPath: string, destPath: string, options?: CopyOptions): AsyncVoidIOResult {
    assertAbsolutePath(destPath);

    const srcHandleRes = await stat(srcPath);

    return srcHandleRes.andThenAsync(async srcHandle => {
        const checkFail = `Both 'srcPath' and 'destPath' must both be a file or directory.`;

        const {
            overwrite = true,
        } = options ?? {};

        // if overwrite is false, we need this flag to determine whether to write file.
        let destExists = false;
        const destHandleRes = await stat(destPath);

        if (destHandleRes.isErr()) {
            if (!isNotFoundError(destHandleRes.unwrapErr())) {
                return destHandleRes.asErr();
            }
        } else {
            destExists = true;
            // check
            const destHandle = destHandleRes.unwrap();
            if (!((isFileHandle(srcHandle) && isFileHandle(destHandle))
                || (isDirectoryHandle(srcHandle) && isDirectoryHandle(destHandle)))) {
                return Err(new Error(checkFail));
            }
        }

        // both are files
        if (isFileHandle(srcHandle)) {
            return (overwrite || !destExists) ? await writeFile(destPath, await srcHandle.getFile()) : RESULT_VOID;
        }

        // both are directories
        const readDirRes = await readDir(srcPath, {
            recursive: true,
        });
        return readDirRes.andThenAsync(async entries => {
            const tasks: AsyncVoidIOResult[] = [
                // make sure new dir created
                mkdir(destPath),
            ];

            for await (const { path, handle } of entries) {
                const newEntryPath = join(destPath, path);

                let newPathExists = false;
                if (destExists) {
                    // should check every file
                    const existsRes = await exists(newEntryPath);
                    if (existsRes.isErr()) {
                        tasks.push(Promise.resolve(existsRes.asErr()));
                        continue;
                    }

                    newPathExists = existsRes.unwrap();
                }

                const res = isFileHandle(handle)
                    ? (overwrite || !newPathExists ? writeFile(newEntryPath, await handle.getFile()) : Promise.resolve(RESULT_VOID))
                    : mkdir(newEntryPath);

                tasks.push(res);
            }

            const allRes = await Promise.all(tasks);
            // anyone failed?
            const fail = allRes.find(x => x.isErr());

            return fail ?? RESULT_VOID;
        });
    });
}

/**
 * Empties the contents of a directory at the specified path.
 *
 * @param dirPath - The path of the directory to empty.
 * @returns A promise that resolves to an `AsyncIOResult` indicating whether the directory was successfully emptied.
 */
export async function emptyDir(dirPath: string): AsyncVoidIOResult {
    const readDirRes = await readDir(dirPath);

    if (readDirRes.isErr()) {
        // create if not exist
        return isNotFoundError(readDirRes.unwrapErr()) ? mkdir(dirPath) : readDirRes.asErr();
    }

    const tasks: AsyncVoidIOResult[] = [];

    for await (const { path } of readDirRes.unwrap()) {
        tasks.push(remove(join(dirPath, path)));
    }

    const allRes = await Promise.all(tasks);
    // anyone failed?
    const fail = allRes.find(x => x.isErr());

    return fail ?? RESULT_VOID;
}

/**
 * Checks whether a file or directory exists at the specified path.
 *
 * @param path - The path of the file or directory to check for existence.
 * @param options - Optional existence options.
 * @returns A promise that resolves to an `AsyncIOResult` indicating whether the file or directory exists.
 */
export async function exists(path: string, options?: ExistsOptions): AsyncIOResult<boolean> {
    const { isDirectory = false, isFile = false } = options ?? {};

    invariant(!(isDirectory && isFile), () => 'ExistsOptions.isDirectory and ExistsOptions.isFile must not be true together.');

    const statRes = await stat(path);

    return statRes.andThen(handle => {
        const notExist =
            (isDirectory && isFileHandle(handle))
            || (isFile && isDirectoryHandle(handle));

        return Ok(!notExist);
    }).orElse((err): IOResult<boolean> => {
        return isNotFoundError(err) ? RESULT_FALSE : statRes.asErr();
    });
}

/**
 * Moves a file handle to a new path.
 *
 * @param fileHandle - The file handle to move.
 * @param newPath - The new path of the file handle.
 * @returns A promise that resolves to an `AsyncVoidIOResult` indicating whether the file handle was successfully moved.
 */
async function moveHandle(fileHandle: FileSystemFileHandle, newPath: string): AsyncVoidIOResult {
    const newDirPath = dirname(newPath);

    return (await getDirHandle(newDirPath, {
        create: true,
    })).andThenAsync(async newDirHandle => {
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
}

/**
 * Move a file or directory from an old path to a new path.
 *
 * @param oldPath - The current path of the file or directory.
 * @param newPath - The new path of the file or directory.
 * @param options - Options of move.
 * @returns A promise that resolves to an `AsyncIOResult` indicating whether the file or directory was successfully moved.
 */
export async function move(oldPath: string, newPath: string, options?: MoveOptions): AsyncVoidIOResult {
    assertAbsolutePath(newPath);

    const srcHandleRes = await stat(oldPath);

    return srcHandleRes.andThenAsync(async srcHandle => {
        const checkFail = `Both 'oldPath' and 'newPath' must both be a file or directory.`;

        const {
            overwrite = true,
        } = options ?? {};

        // if overwrite is false, we need this flag to determine whether to write file.
        let destExists = false;
        const destHandleRes = await stat(newPath);

        if (destHandleRes.isErr()) {
            if (!isNotFoundError(destHandleRes.unwrapErr())) {
                return destHandleRes.asErr();
            }
        } else {
            destExists = true;
            // check
            const destHandle = destHandleRes.unwrap();
            if (!((isFileHandle(srcHandle) && isFileHandle(destHandle))
                || (isDirectoryHandle(srcHandle) && isDirectoryHandle(destHandle)))) {
                return Err(new Error(checkFail));
            }
        }

        // both are files
        if (isFileHandle(srcHandle)) {
            return moveHandle(srcHandle, newPath);
        }

        // both are directories
        const readDirRes = await readDir(oldPath, {
            recursive: true,
        });
        return readDirRes.andThenAsync(async entries => {
            const tasks: AsyncVoidIOResult[] = [
                // make sure new dir created
                mkdir(newPath),
            ];

            for await (const { path, handle } of entries) {
                const newEntryPath = join(newPath, path);

                let newPathExists = false;
                if (destExists) {
                    // should check every file
                    const existsRes = await exists(newEntryPath);
                    if (existsRes.isErr()) {
                        tasks.push(Promise.resolve(existsRes.asErr()));
                        continue;
                    }

                    newPathExists = existsRes.unwrap();
                }

                const res: AsyncVoidIOResult = isFileHandle(handle)
                    ? (overwrite || !newPathExists ? moveHandle(handle, newEntryPath) : Promise.resolve(RESULT_VOID))
                    : mkdir(newEntryPath);

                tasks.push(res);
            }

            const allRes = await Promise.all(tasks);
            // anyone failed?
            const fail = allRes.find(x => x.isErr());

            // remove old dir
            return fail ?? await remove(oldPath);
        });
    });
}

/**
 * Reads the content of a file at the specified path as a File.
 *
 * @param filePath - The path of the file to read.
 * @returns A promise that resolves to an `AsyncIOResult` containing the file content as a File.
 */
export function readBlobFile(filePath: string): AsyncIOResult<File> {
    return readFile(filePath, {
        encoding: 'blob',
    });
}

/**
 * Reads the content of a file at the specified path as a string.
 *
 * @param filePath - The path of the file to read.
 * @returns A promise that resolves to an `AsyncIOResult` containing the file content as a string.
 */
export function readTextFile(filePath: string): AsyncIOResult<string> {
    return readFile(filePath, {
        encoding: 'utf8',
    });
}