import { basename, dirname, join } from '@std/path/posix';
import { Err, Ok, RESULT_FALSE, RESULT_VOID, type AsyncIOResult, type AsyncVoidIOResult, type IOResult } from 'happy-rusty';
import invariant from 'tiny-invariant';
import { assertAbsolutePath } from './assertions.ts';
import type { CopyOptions, ExistsOptions, MoveOptions, WriteFileContent } from './defines.ts';
import { getDirHandle, getFinalResult, isNotFoundError } from './helpers.ts';
import { mkdir, readDir, readFile, remove, stat, writeFile } from './opfs_core.ts';
import { isDirectoryHandle, isFileHandle } from './utils.ts';

/**
 * Moves a file handle to a new path using the FileSystemFileHandle.move() method.
 * This is an optimized operation that avoids data copying.
 *
 * @param fileHandle - The file handle to move.
 * @param newPath - The new absolute path for the file.
 * @returns A promise that resolves to an `AsyncVoidIOResult` indicating success or failure.
 * @internal
 */
async function moveHandle(fileHandle: FileSystemFileHandle, newPath: string): AsyncVoidIOResult {
    const newDirPath = dirname(newPath);

    return (await getDirHandle(newDirPath, {
        create: true,
    })).andThenAsync(async newDirHandle => {
        const newName = basename(newPath);

        try {
            // TODO ts not support yet
            await (fileHandle as FileSystemFileHandle & {
                move(newParent: FileSystemDirectoryHandle, newName: string): Promise<void>;
            }).move(newDirHandle, newName);
            return RESULT_VOID;
        } catch (e) {
            return Err(e as DOMException);
        }
    });
}

/**
 * Handler function type for processing source file to destination.
 *
 * @param srcFileHandle - The source file handle to process.
 * @param destFilePath - The destination file path.
 * @internal
 */
type HandleSrcFileToDest = (srcFileHandle: FileSystemFileHandle, destFilePath: string) => AsyncVoidIOResult;

/**
 * Internal helper that copies or moves a file/directory from source to destination.
 *
 * Algorithm:
 * 1. Verify source exists via stat()
 * 2. Check if destination exists and validate type compatibility (file-to-file or dir-to-dir)
 * 3. For files: directly apply handler (copy or move)
 * 4. For directories: recursively process all entries in parallel
 * 5. Respect overwrite flag - skip if dest exists and overwrite=false
 *
 * @param srcPath - The source file/directory path.
 * @param destPath - The destination file/directory path.
 * @param handler - The function to handle file transfer (copy or move).
 * @param overwrite - Whether to overwrite existing files. Default: `true`.
 * @returns A promise that resolves to an `AsyncVoidIOResult` indicating success or failure.
 * @internal
 */
async function mkDestFromSrc(srcPath: string, destPath: string, handler: HandleSrcFileToDest, overwrite = true): AsyncVoidIOResult {
    assertAbsolutePath(destPath);

    return (await stat(srcPath)).andThenAsync(async srcHandle => {
        // Track whether destination already exists (needed for overwrite logic)
        let destExists = false;
        const destHandleRes = await stat(destPath);

        if (destHandleRes.isErr()) {
            // Destination doesn't exist - that's OK unless it's an unexpected error
            if (!isNotFoundError(destHandleRes.unwrapErr())) {
                return destHandleRes.asErr();
            }
        } else {
            destExists = true;
            // Validate type compatibility: both must be files OR both must be directories
            const destHandle = destHandleRes.unwrap();
            if (!((isFileHandle(srcHandle) && isFileHandle(destHandle))
                || (isDirectoryHandle(srcHandle) && isDirectoryHandle(destHandle)))) {
                return Err(new Error(`Both 'srcPath' and 'destPath' must both be a file or directory.`));
            }
        }

        // Handle file source: apply handler directly
        if (isFileHandle(srcHandle)) {
            return (overwrite || !destExists) ? await handler(srcHandle, destPath) : RESULT_VOID;
        }

        // Handle directory source: recursively process all entries
        const readDirRes = await readDir(srcPath, {
            recursive: true,
        });
        return readDirRes.andThenAsync(async entries => {
            // Collect all tasks for parallel execution
            const tasks: AsyncVoidIOResult[] = [
                // Ensure destination directory exists first
                mkdir(destPath),
            ];

            for await (const { path, handle } of entries) {
                const newEntryPath = join(destPath, path);
                // Wrap each entry processing in an async IIFE for parallel execution
                tasks.push((async (): AsyncVoidIOResult => {
                    let newPathExists = false;

                    if (destExists) {
                        // Destination dir exists, need to check each file individually
                        const existsRes = await exists(newEntryPath);
                        if (existsRes.isErr()) {
                            return existsRes.asErr();
                        }

                        newPathExists = existsRes.unwrap();
                    }

                    // For files: apply handler; for directories: just create them
                    return isFileHandle(handle)
                        ? (overwrite || !newPathExists ? handler(handle, newEntryPath) : Promise.resolve(RESULT_VOID))
                        : mkdir(newEntryPath);
                })());
            }

            // Wait for all tasks and return first error if any
            return getFinalResult(tasks);
        });
    });
}

/**
 * Appends content to a file at the specified path.
 * Creates the file if it doesn't exist.
 *
 * @param filePath - The absolute path of the file to append to.
 * @param contents - The content to append (string, ArrayBuffer, TypedArray, or Blob).
 * @returns A promise that resolves to an `AsyncVoidIOResult` indicating success or failure.
 * @example
 * ```typescript
 * await appendFile('/path/to/log.txt', 'New log entry\n');
 * ```
 */
export function appendFile(filePath: string, contents: WriteFileContent): AsyncVoidIOResult {
    return writeFile(filePath, contents, {
        append: true,
    });
}

/**
 * Copies a file or directory from one location to another, similar to `cp -r`.
 * Both source and destination must be of the same type (both files or both directories).
 *
 * @param srcPath - The absolute source path.
 * @param destPath - The absolute destination path.
 * @param options - Optional copy options.
 * @param options.overwrite - Whether to overwrite existing files. Default: `true`.
 * @returns A promise that resolves to an `AsyncVoidIOResult` indicating success or failure.
 * @example
 * ```typescript
 * // Copy a file
 * await copy('/src/file.txt', '/dest/file.txt');
 *
 * // Copy a directory
 * await copy('/src/folder', '/dest/folder');
 *
 * // Copy without overwriting existing files
 * await copy('/src', '/dest', { overwrite: false });
 * ```
 */
export async function copy(srcPath: string, destPath: string, options?: CopyOptions): AsyncVoidIOResult {
    const {
        overwrite = true,
    } = options ?? {};

    return mkDestFromSrc(srcPath, destPath, async (srcHandle, destPath) => {
        return await writeFile(destPath, await srcHandle.getFile());
    }, overwrite);
}

/**
 * Empties all contents of a directory at the specified path.
 * If the directory doesn't exist, it will be created.
 *
 * @param dirPath - The absolute path of the directory to empty.
 * @returns A promise that resolves to an `AsyncVoidIOResult` indicating success or failure.
 * @example
 * ```typescript
 * await emptyDir('/path/to/directory');
 * ```
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

    return getFinalResult(tasks);
}

/**
 * Checks whether a file or directory exists at the specified path.
 *
 * @param path - The absolute path to check.
 * @param options - Optional existence options.
 * @param options.isDirectory - If `true`, returns `true` only if the path is a directory.
 * @param options.isFile - If `true`, returns `true` only if the path is a file.
 * @returns A promise that resolves to an `AsyncIOResult<boolean>` indicating existence.
 * @example
 * ```typescript
 * // Check if path exists (file or directory)
 * const exists = await exists('/path/to/entry');
 *
 * // Check if path exists and is a file
 * const isFile = await exists('/path/to/file', { isFile: true });
 *
 * // Check if path exists and is a directory
 * const isDir = await exists('/path/to/dir', { isDirectory: true });
 * ```
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
 * Moves a file or directory from one location to another.
 * Both source and destination must be of the same type (both files or both directories).
 *
 * @param srcPath - The absolute source path.
 * @param destPath - The absolute destination path.
 * @param options - Optional move options.
 * @param options.overwrite - Whether to overwrite existing files. Default: `true`.
 * @returns A promise that resolves to an `AsyncVoidIOResult` indicating success or failure.
 * @example
 * ```typescript
 * // Move/rename a file
 * await move('/old/path/file.txt', '/new/path/file.txt');
 *
 * // Move a directory
 * await move('/old/folder', '/new/folder');
 * ```
 */
export async function move(srcPath: string, destPath: string, options?: MoveOptions): AsyncVoidIOResult {
    const {
        overwrite = true,
    } = options ?? {};

    return (await mkDestFromSrc(srcPath, destPath, moveHandle, overwrite)).andThenAsync(() => {
        // finally remove src
        return remove(srcPath);
    });
}

/**
 * Reads the content of a file as a `File` object (Blob with name).
 *
 * @param filePath - The absolute path of the file to read.
 * @returns A promise that resolves to an `AsyncIOResult` containing the `File` object.
 * @example
 * ```typescript
 * const result = await readBlobFile('/path/to/file.txt');
 * if (result.isOk()) {
 *     const file = result.unwrap();
 *     console.log(file.name, file.size, file.type);
 * }
 * ```
 */
export function readBlobFile(filePath: string): AsyncIOResult<File> {
    return readFile(filePath, {
        encoding: 'blob',
    });
}

/**
 * Reads a JSON file and parses its content.
 *
 * @template T - The expected type of the parsed JSON object.
 * @param filePath - The path of the JSON file to read.
 * @returns A promise that resolves to an `AsyncIOResult` containing the parsed JSON object.
 * @example
 * ```typescript
 * interface Config {
 *     name: string;
 *     version: number;
 * }
 * const result = await readJsonFile<Config>('/config.json');
 * if (result.isOk()) {
 *     console.log(result.unwrap().name);
 * }
 * ```
 */
export async function readJsonFile<T>(filePath: string): AsyncIOResult<T> {
    return (await readTextFile(filePath)).andThen(contents => {
        try {
            return Ok(JSON.parse(contents));
        } catch (e) {
            return Err(e as Error);
        }
    });
}

/**
 * Reads a file as a UTF-8 string.
 *
 * @param filePath - The absolute path of the file to read.
 * @returns A promise that resolves to an `AsyncIOResult` containing the file content as a string.
 * @example
 * ```typescript
 * const result = await readTextFile('/path/to/file.txt');
 * if (result.isOk()) {
 *     console.log(result.unwrap());
 * }
 * ```
 */
export function readTextFile(filePath: string): AsyncIOResult<string> {
    return readFile(filePath, {
        encoding: 'utf8',
    });
}

/**
 * Writes an object to a file as JSON.
 *
 * @template T - The type of the object to write.
 * @param filePath - The absolute path of the file to write.
 * @param data - The object to serialize and write.
 * @returns A promise that resolves to an `AsyncVoidIOResult` indicating success or failure.
 * @example
 * ```typescript
 * const config = { name: 'app', version: 1 };
 * const result = await writeJsonFile('/config.json', config);
 * if (result.isOk()) {
 *     console.log('Config saved');
 * }
 * ```
 */
export function writeJsonFile<T>(filePath: string, data: T): AsyncVoidIOResult {
    try {
        const contents = JSON.stringify(data);
        return writeFile(filePath, contents);
    } catch (e) {
        return Promise.resolve(Err(e as Error));
    }
}