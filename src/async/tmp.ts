import { Ok, type AsyncIOResult, type AsyncVoidIOResult } from 'happy-rusty';
import { validateExpiredDate } from '../shared/internal/mod.ts';
import { generateTempPath, isFileHandle, TMP_DIR, type TempOptions } from '../shared/mod.ts';
import { createFile, mkdir, remove } from './core/mod.ts';
import { getDirHandle, removeHandle } from './internal/mod.ts';

/**
 * Creates a temporary file or directory in the `/tmp` directory.
 * Uses `crypto.randomUUID()` to generate a unique name.
 *
 * @param options - Options for creating the temporary path.
 * @returns A promise that resolves to an `AsyncIOResult` containing the created path.
 * @since 1.7.0
 * @see {@link generateTempPath} for generating paths without creating
 * @see {@link deleteTemp} for removing the entire temp directory
 * @see {@link pruneTemp} for removing expired temp files
 * @example
 * ```typescript
 * // Create a temporary file
 * (await mkTemp())
 *     .inspect(path => console.log(path)); // '/tmp/tmp-550e8400-e29b-41d4-a716-446655440000'
 *
 * // Create a temporary directory
 * await mkTemp({ isDirectory: true });
 *
 * // Create with custom basename and extension
 * await mkTemp({ basename: 'cache', extname: '.json' });
 * ```
 */
export async function mkTemp(options?: TempOptions): AsyncIOResult<string> {
    const path = generateTempPath(options);
    const { isDirectory = false } = options ?? {};

    const res = await (isDirectory ? mkdir : createFile)(path);

    return res.and(Ok(path));
}

/**
 * Deletes the entire temporary directory (`/tmp`) and all its contents.
 *
 * **Warning:** When writing a `ReadableStream` to a new file, `writeFile` uses a temporary file
 * in `/tmp` before moving it to the target path. Calling `deleteTemp()` during such operations
 * may cause the write to fail. Ensure no stream writes are in progress before calling this function.
 *
 * @returns A promise that resolves to an `AsyncVoidIOResult` indicating success or failure.
 * @since 1.7.0
 * @see {@link pruneTemp} for selective cleanup
 * @see {@link remove} for general file/directory removal
 * @example
 * ```typescript
 * (await deleteTemp())
 *     .inspect(() => console.log('Temporary directory deleted'));
 * ```
 */
export function deleteTemp(): AsyncVoidIOResult {
    return remove(TMP_DIR);
}

/**
 * Removes expired files from the temporary directory.
 * Only removes direct children files whose `lastModified` time is before the specified date.
 *
 * **Note:** This function only removes files directly under `/tmp`, not subdirectories or their contents.
 * Use `deleteTemp()` to remove the entire temporary directory including all nested content.
 *
 * @param expired - Files modified before this date will be deleted.
 * @returns A promise that resolves to an `AsyncVoidIOResult` indicating success or failure.
 * @since 1.7.0
 * @see {@link deleteTemp} for removing all temp files
 * @see {@link mkTemp} for creating temp files
 * @example
 * ```typescript
 * // Remove files older than 24 hours
 * const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
 * const result = await pruneTemp(yesterday);
 * ```
 */
export async function pruneTemp(expired: Date): AsyncVoidIOResult {
    const expiredRes = validateExpiredDate(expired);
    if (expiredRes.isErr()) return expiredRes;

    // Get TMP_DIR handle to iterate and reuse for removal
    const tmpDirHandleRes = await getDirHandle(TMP_DIR);

    return tmpDirHandleRes.andTryAsync(async tmpDirHandle => {
        const expiredTime = expired.getTime();
        const tasks: Promise<void>[] = [];

        // Only process direct children (no recursive), since mkTemp only creates top-level items
        for await (const handle of tmpDirHandle.values()) {
            if (!isFileHandle(handle)) {
                continue;
            }

            tasks.push((async () => {
                const file = await handle.getFile();
                if (file.lastModified <= expiredTime) {
                    return removeHandle(handle, tmpDirHandle);
                }
            })());
        }

        if (tasks.length > 0) {
            await Promise.all(tasks);
        }
    });
}