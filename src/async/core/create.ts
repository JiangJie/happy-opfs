import { RESULT_VOID, type AsyncVoidIOResult } from 'happy-rusty';
import { getDirHandle, getFileHandle, validateAbsolutePath } from '../internal/mod.ts';

/**
 * Creates a new empty file at the specified path, similar to the `touch` command.
 * If the file already exists, this operation succeeds without modifying it.
 * Parent directories are created automatically if they don't exist.
 *
 * **Note:** For temporary files, use {@link mkTemp} instead, which provides
 * automatic unique naming and integrates with {@link pruneTemp} for cleanup.
 *
 * @param filePath - The absolute path of the file to create.
 * @returns A promise that resolves to an `AsyncVoidIOResult` indicating success or failure.
 * @since 1.7.0
 * @see {@link createFileSync} for synchronous version
 * @see {@link mkTemp} for creating temporary files
 * @see {@link writeFile} for creating files with content
 * @example
 * ```typescript
 * (await createFile('/path/to/file.txt'))
 *     .inspect(() => console.log('File created'));
 * ```
 */
export async function createFile(filePath: string): AsyncVoidIOResult {
    const filePathRes = validateAbsolutePath(filePath);
    if (filePathRes.isErr()) return filePathRes.asErr();
    filePath = filePathRes.unwrap();

    const handleRes = await getFileHandle(filePath, {
        create: true,
    });

    return handleRes.and(RESULT_VOID);
}

/**
 * Creates a new directory at the specified path, similar to `mkdir -p`.
 * Creates all necessary parent directories if they don't exist.
 *
 * **Note:** For temporary directories, use {@link mkTemp} with `{ isDirectory: true }` instead,
 * which provides automatic unique naming and integrates with temporary file management.
 *
 * @param dirPath - The absolute path where the directory will be created.
 * @returns A promise that resolves to an `AsyncVoidIOResult` indicating success or failure.
 * @since 1.0.0
 * @see {@link mkdirSync} for synchronous version
 * @see {@link emptyDir} for creating or emptying a directory
 * @see {@link mkTemp} for creating temporary directories
 * @example
 * ```typescript
 * (await mkdir('/path/to/new/directory'))
 *     .inspect(() => console.log('Directory created'));
 * ```
 */
export async function mkdir(dirPath: string): AsyncVoidIOResult {
    const dirPathRes = validateAbsolutePath(dirPath);
    if (dirPathRes.isErr()) return dirPathRes.asErr();
    dirPath = dirPathRes.unwrap();

    const handleRes = await getDirHandle(dirPath, {
        create: true,
    });

    return handleRes.and(RESULT_VOID);
}
