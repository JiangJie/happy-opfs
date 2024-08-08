import { join } from '@std/path/posix';
import { Err, Ok, RESULT_FALSE, RESULT_VOID, type AsyncIOResult, type AsyncVoidIOResult, type IOResult } from 'happy-rusty';
import invariant from 'tiny-invariant';
import { assertAbsolutePath } from './assertions.ts';
import type { CopyOptions, ExistsOptions, WriteFileContent } from './defines.ts';
import { isNotFoundError } from './helpers.ts';
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
    if (srcHandleRes.isErr()) {
        return srcHandleRes.asErr();
    }

    const checkFail = `Both 'srcPath' and 'destPath' must both be a file or directory.`;

    const {
        overwrite = true,
    } = options ?? {};

    // if overwrite is false, we need this flag to determine whether to write file.
    let destExists = false;

    const srcHandle = srcHandleRes.unwrap();
    if (isFileHandle(srcHandle)) {

        const destHandleRes = await stat(destPath);
        if (destHandleRes.isErr()) {
            if (!isNotFoundError(destHandleRes.unwrapErr())) {
                return destHandleRes.asErr();
            }
        } else {
            destExists = true;

            // check
            if (isDirectoryHandle(destHandleRes.unwrap())) {
                return Err(new Error(checkFail));
            }
        }

        return (overwrite || !destExists) ? await writeFile(destPath, await srcHandle.getFile()) : RESULT_VOID;
    }

    const destHandleRes = await stat(destPath);
    if (destHandleRes.isErr()) {
        if (!isNotFoundError(destHandleRes.unwrapErr())) {
            return destHandleRes.asErr();
        }
    } else {
        destExists = true;

        // check
        if (isFileHandle(destHandleRes.unwrap())) {
            return Err(new Error(checkFail));
        }
    }

    const readDirRes = await readDir(srcPath, {
        recursive: true,
    });
    if (readDirRes.isErr()) {
        return readDirRes.asErr();
    }

    const tasks: AsyncVoidIOResult[] = [];

    for await (const { path, handle } of readDirRes.unwrap()) {
        const newPath = join(destPath, path);

        let newPathExists = false;
        if (destExists) {
            // should check every file
            const existsRes = await exists(newPath);
            if (existsRes.isErr()) {
                tasks.push(Promise.resolve(existsRes.asErr()));
                continue;
            }

            newPathExists = existsRes.unwrap();
        }

        const res = isFileHandle(handle)
            ? (overwrite || !newPathExists ? writeFile(newPath, await handle.getFile()) : Promise.resolve(RESULT_VOID))
            : mkdir(newPath);

        tasks.push(res);
    }

    const allRes = await Promise.all(tasks);
    // anyone failed?
    const fail = allRes.find(x => x.isErr());

    return fail ?? RESULT_VOID;
}

/**
 * Empties the contents of a directory at the specified path.
 *
 * @param dirPath - The path of the directory to empty.
 * @returns A promise that resolves to an `AsyncIOResult` indicating whether the directory was successfully emptied.
 */
export async function emptyDir(dirPath: string): AsyncVoidIOResult {
    const res = await readDir(dirPath);

    if (res.isErr()) {
        // create if not exist
        return isNotFoundError(res.unwrapErr()) ? mkdir(dirPath) : res.asErr();
    }

    const tasks: AsyncVoidIOResult[] = [];

    for await (const { path } of res.unwrap()) {
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

    const stats = await stat(path);

    return stats.andThen(handle => {
        const notExist =
            (isDirectory && isFileHandle(handle))
            || (isFile && isDirectoryHandle(handle));

        return Ok(!notExist);
    }).orElse((err): IOResult<boolean> => {
        return isNotFoundError(err) ? RESULT_FALSE : stats.asErr();
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