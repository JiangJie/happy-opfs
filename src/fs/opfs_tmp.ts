import { join, SEPARATOR } from '@std/path/posix';
import { Ok, type AsyncIOResult, type AsyncVoidIOResult } from 'happy-rusty';
import invariant from 'tiny-invariant';
import { TMP_DIR } from './constants.ts';
import type { TempOptions } from './defines.ts';
import { isFileHandle } from './guards.ts';
import { getDirHandle, removeHandle } from './helpers.ts';
import { createFile, mkdir, remove } from './opfs_core.ts';

/**
 * Generates a unique temporary file or directory path without creating it.
 * Uses `crypto.randomUUID()` to ensure uniqueness.
 *
 * @param options - Options for generating the temporary path.
 * @returns The generated temporary path string.
 * @example
 * ```typescript
 * generateTempPath();                           // '/tmp/tmp-550e8400-e29b-41d4-a716-446655440000'
 * generateTempPath({ basename: 'cache' });      // '/tmp/cache-550e8400-e29b-41d4-a716-446655440000'
 * generateTempPath({ extname: '.txt' });        // '/tmp/tmp-550e8400-e29b-41d4-a716-446655440000.txt'
 * generateTempPath({ isDirectory: true });      // '/tmp/tmp-550e8400-e29b-41d4-a716-446655440000'
 * ```
 */
export function generateTempPath(options?: TempOptions): string {
    const {
        isDirectory = false,
        basename = 'tmp',
        extname = '',
    } = options ?? {};

    const base = basename ? `${ basename }-` : '';
    const ext = isDirectory ? '' : extname;

    // use uuid to generate a unique name
    return join(TMP_DIR, `${ base }${ crypto.randomUUID() }${ ext }`);
}

/**
 * Checks whether the path is a temporary path (under `/tmp`).
 *
 * @param path - The path to check.
 * @returns `true` if the path starts with `/tmp/`, otherwise `false`.
 * @example
 * ```typescript
 * isTempPath('/tmp/file.txt');  // true
 * isTempPath('/data/file.txt'); // false
 * ```
 */
export function isTempPath(path: string): boolean {
    return path.startsWith(`${ TMP_DIR }${ SEPARATOR }`);
}

/**
 * Creates a temporary file or directory in the `/tmp` directory.
 * Uses `crypto.randomUUID()` to generate a unique name.
 *
 * @param options - Options for creating the temporary path.
 * @returns A promise that resolves to an `AsyncIOResult` containing the created path.
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
    const { isDirectory = false } = options ?? {};

    const path = generateTempPath(options);
    const res = await (isDirectory ? mkdir : createFile)(path);

    return res.and(Ok(path));
}

/**
 * Deletes the entire temporary directory (`/tmp`) and all its contents.
 *
 * @returns A promise that resolves to an `AsyncVoidIOResult` indicating success or failure.
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
 * @example
 * ```typescript
 * // Remove files older than 24 hours
 * const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
 * const result = await pruneTemp(yesterday);
 * ```
 */
export async function pruneTemp(expired: Date): AsyncVoidIOResult {
    invariant(expired instanceof Date, () => `Expired must be a Date but received ${ expired }`);

    // Get TMP_DIR handle to iterate and reuse for removal
    const tmpDirHandleRes = await getDirHandle(TMP_DIR);

    return tmpDirHandleRes.andTryAsync(async tmpDirHandle => {
        const tasks: Promise<void>[] = [];

        // Only process direct children (no recursive), since mkTemp only creates top-level items
        for await (const handle of tmpDirHandle.values()) {
            if (!isFileHandle(handle)) {
                continue;
            }

            tasks.push((async () => {
                const file = await handle.getFile();
                if (file.lastModified <= expired.getTime()) {
                    await removeHandle(handle, tmpDirHandle);
                }
            })());
        }

        if (tasks.length > 0) {
            await Promise.all(tasks);
        }
    });
}