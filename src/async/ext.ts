import { join, SEPARATOR } from '@std/path/posix';
import { Err, RESULT_FALSE, RESULT_VOID, tryAsyncResult, tryResult, type AsyncIOResult, type AsyncVoidIOResult } from 'happy-rusty';
import { isDirectoryHandle, isFileHandle, type CopyOptions, type ExistsOptions, type MoveOptions, type WriteFileContent } from '../shared/mod.ts';
import { mkdir, readDir, readFile, remove, stat, writeFile } from './core/mod.ts';
import { aggregateResults, isNotFoundError, isRootDir, markParentDirsNonEmpty, moveFileHandle, validateAbsolutePath, validateExistsOptions } from './internal/mod.ts';

/**
 * Appends content to a file at the specified path.
 * Creates the file if it doesn't exist.
 *
 * @param filePath - The absolute path of the file to append to.
 * @param contents - The content to append (string, ArrayBuffer, TypedArray, or Blob).
 * @returns A promise that resolves to an `AsyncVoidIOResult` indicating success or failure.
 * @since 1.0.0
 * @see {@link writeFile} with `append: true` option
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
 * @since 1.7.0
 * @see {@link move} for moving instead of copying
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
export function copy(srcPath: string, destPath: string, options?: CopyOptions): AsyncVoidIOResult {
    return mkDestFromSrc(srcPath, destPath, copyFileHandle, 'copy', options?.overwrite);
}

/**
 * Empties all contents of a directory at the specified path.
 * If the directory doesn't exist, it will be created.
 *
 * @param dirPath - The absolute path of the directory to empty.
 * @returns A promise that resolves to an `AsyncVoidIOResult` indicating success or failure.
 * @since 1.0.9
 * @see {@link mkdir} for creating directories
 * @see {@link remove} for removing directories
 * @example
 * ```typescript
 * await emptyDir('/path/to/directory');
 * ```
 */
export async function emptyDir(dirPath: string): AsyncVoidIOResult {
    // For root directory, remove() clears all contents
    if (isRootDir(dirPath)) {
        return remove(dirPath);
    }

    // Check if path is a directory
    const statRes = await stat(dirPath);
    if (statRes.isErr()) {
        // Create if not exist
        return isNotFoundError(statRes.unwrapErr())
            ? mkdir(dirPath)
            : statRes.asErr();
    }

    if (isFileHandle(statRes.unwrap())) {
        return Err(new Error(`Path '${ dirPath }' is not a directory`));
    }

    // Remove and recreate directory (OPFS has no metadata to preserve)
    const removeRes = await remove(dirPath);
    return removeRes.andThenAsync(() => mkdir(dirPath));
}

/**
 * Checks whether a file or directory exists at the specified path.
 *
 * @param path - The absolute path to check.
 * @param options - Optional existence options. Set `isDirectory: true` to check for directory,
 *                  or `isFile: true` to check for file. Cannot set both to `true`.
 * @returns A promise that resolves to an `AsyncIOResult<boolean>` indicating existence.
 * @since 1.0.0
 * @see {@link existsSync} for synchronous version
 * @see {@link stat} for getting the handle
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
    const optionsRes = validateExistsOptions(options);
    if (optionsRes.isErr()) return optionsRes.asErr();

    const statRes = await stat(path);

    return statRes.map(handle => {
        const { isDirectory = false, isFile = false } = options ?? {};
        const notExist =
            (isDirectory && isFileHandle(handle))
            || (isFile && isDirectoryHandle(handle));
        return !notExist;
    }).orElse(err => {
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
 * @since 1.8.0
 * @see {@link copy} for copying instead of moving
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
    const mkRes = await mkDestFromSrc(srcPath, destPath, moveFileHandle, 'move', options?.overwrite);
    return mkRes.andThenAsync(() => remove(srcPath));
}

/**
 * Reads the content of a file as a `File` object (Blob with name).
 *
 * @param filePath - The absolute path of the file to read.
 * @returns A promise that resolves to an `AsyncIOResult` containing the `File` object.
 * @since 1.0.0
 * @see {@link readFile} with `encoding: 'blob'`
 * @see {@link uploadFile} for uploading files
 * @example
 * ```typescript
 * (await readBlobFile('/path/to/file.txt'))
 *     .inspect(file => console.log(file.name, file.size, file.type));
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
 * @since 1.8.4
 * @see {@link writeJsonFile} for the reverse operation
 * @see {@link readTextFile} for reading raw text
 * @example
 * ```typescript
 * interface Config {
 *     name: string;
 *     version: number;
 * }
 * (await readJsonFile<Config>('/config.json'))
 *     .inspect(config => console.log(config.name));
 * ```
 */
export async function readJsonFile<T>(filePath: string): AsyncIOResult<T> {
    const readRes = await readTextFile(filePath);
    return readRes.andThen(text => tryResult<T, Error, [string]>(JSON.parse, text));
}

/**
 * Reads a file as a UTF-8 string.
 *
 * @param filePath - The absolute path of the file to read.
 * @returns A promise that resolves to an `AsyncIOResult` containing the file content as a string.
 * @since 1.0.0
 * @see {@link readFile} with `encoding: 'utf8'`
 * @see {@link readJsonFile} for reading JSON files
 * @example
 * ```typescript
 * (await readTextFile('/path/to/file.txt'))
 *     .inspect(content => console.log(content));
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
 * @since 1.0.0
 * @see {@link readJsonFile} for the reverse operation
 * @see {@link writeFile} for writing raw content
 * @example
 * ```typescript
 * const config = { name: 'app', version: 1 };
 * (await writeJsonFile('/config.json', config))
 *     .inspect(() => console.log('Config saved'));
 * ```
 */
export function writeJsonFile<T>(filePath: string, data: T): AsyncVoidIOResult {
    const result = tryResult(JSON.stringify, data);
    return result.andThenAsync(text => writeFile(filePath, text));
}

// #region Internal Types

/**
 * Handler function type for processing source file to destination.
 *
 * @param srcFileHandle - The source file handle to process.
 * @param destFilePath - The destination file path.
 */
type HandleSrcFileToDest = (srcFileHandle: FileSystemFileHandle, destFilePath: string) => AsyncVoidIOResult;

// #endregion

// #region Internal Functions

/**
 * Copies a file handle to a new path by reading and writing the file content.
 *
 * @param fileHandle - The file handle to copy.
 * @param destFilePath - The destination absolute path for the file.
 * @returns A promise that resolves to an `AsyncVoidIOResult` indicating success or failure.
 */
async function copyFileHandle(fileHandle: FileSystemFileHandle, destFilePath: string): AsyncVoidIOResult {
    const fileRes = await tryAsyncResult(fileHandle.getFile());
    return fileRes.andThenAsync(file => writeFile(destFilePath, file));
}

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
 * @param opName - The operation name for error messages ('copy' or 'move').
 * @param overwrite - Whether to overwrite existing files. Default: `true`.
 * @returns A promise that resolves to an `AsyncVoidIOResult` indicating success or failure.
 */
async function mkDestFromSrc(
    srcPath: string,
    destPath: string,
    handler: HandleSrcFileToDest,
    opName: 'copy' | 'move',
    overwrite = true,
): AsyncVoidIOResult {
    const srcPathRes = validateAbsolutePath(srcPath);
    if (srcPathRes.isErr()) return srcPathRes.asErr();
    srcPath = srcPathRes.unwrap();

    const destPathRes = validateAbsolutePath(destPath);
    if (destPathRes.isErr()) return destPathRes.asErr();
    destPath = destPathRes.unwrap();

    // Prevent copying/moving a directory into itself
    // For root directory, any destPath is a subdirectory
    if (isRootDir(srcPath) || destPath.startsWith(srcPath + SEPARATOR) || destPath === srcPath) {
        return Err(new Error(`Cannot ${ opName } '${ srcPath }' into itself '${ destPath }'`));
    }

    const statRes = await stat(srcPath);
    if (statRes.isErr()) {
        return statRes.asErr();
    }

    const srcHandle = statRes.unwrap();
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
        if (
            !(isFileHandle(srcHandle) && isFileHandle(destHandle))
            && !(isDirectoryHandle(srcHandle) && isDirectoryHandle(destHandle))
        ) {
            return Err(new Error(`Source '${ srcPath }' and destination '${ destPath }' must both be files or both be directories`));
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
    if (readDirRes.isErr()) {
        return readDirRes.asErr();
    }

    // Collect all tasks for parallel execution
    const tasks: AsyncVoidIOResult[] = [];
    const dirs: string[] = [];
    const nonEmptyDirs = new Set<string>();

    try {
        for await (const { path, handle } of readDirRes.unwrap()) {
            if (isFileHandle(handle)) {
                const newFilePath = join(destPath, path);

                // Wrap file processing in an async IIFE for parallel execution
                tasks.push((async () => {
                    let newPathExists = false;

                    if (destExists) {
                    // Destination dir exists, need to check each file individually
                        const existsRes = await exists(newFilePath);
                        if (existsRes.isErr()) {
                            return existsRes.asErr();
                        }

                        newPathExists = existsRes.unwrap();
                    }

                    return overwrite || !newPathExists ? handler(handle, newFilePath) : RESULT_VOID;
                })());

                // Mark all parent directories as non-empty
                markParentDirsNonEmpty(path, nonEmptyDirs);
            } else {
                dirs.push(path);
            }
        }
    } catch (e) {
        return Err(e as Error);
    }

    // Only create truly empty directories
    for (const dir of dirs) {
        if (!nonEmptyDirs.has(dir)) {
            tasks.push(mkdir(join(destPath, dir)));
        }
    }

    // Handle empty source directory case
    if (tasks.length === 0 && !destExists) {
        return mkdir(destPath);
    }

    // Wait for all tasks and return first error if any
    return aggregateResults(tasks);
}

// #endregion
