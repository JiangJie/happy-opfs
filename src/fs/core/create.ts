import { RESULT_VOID, type AsyncVoidIOResult } from 'happy-rusty';
import { assertAbsolutePath } from '../assertions.ts';
import { getDirHandle, getFileHandle } from '../helpers.ts';

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
 * @example
 * ```typescript
 * (await createFile('/path/to/file.txt'))
 *     .inspect(() => console.log('File created'));
 * ```
 */
export async function createFile(filePath: string): AsyncVoidIOResult {
    filePath = assertAbsolutePath(filePath);

    const res = await getFileHandle(filePath, {
        create: true,
    });

    return res.and(RESULT_VOID);
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
 * @example
 * ```typescript
 * (await mkdir('/path/to/new/directory'))
 *     .inspect(() => console.log('Directory created'));
 * ```
 */
export async function mkdir(dirPath: string): AsyncVoidIOResult {
    dirPath = assertAbsolutePath(dirPath);

    const res = await getDirHandle(dirPath, {
        create: true,
    });

    return res.and(RESULT_VOID);
}
