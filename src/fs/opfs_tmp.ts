import { Err, Ok, RESULT_VOID, type AsyncIOResult, type AsyncVoidIOResult } from 'happy-rusty';
import invariant from 'tiny-invariant';
import { TMP_DIR } from './constants.ts';
import type { TempOptions } from './defines.ts';
import { createFile, mkdir, readDir, remove } from './opfs_core.ts';
import { generateTempPath, isFileHandle } from './utils.ts';

/**
 * Creates a temporary file or directory in the `/tmp` directory.
 * Uses `crypto.randomUUID()` to generate a unique name.
 *
 * @param options - Options for creating the temporary path.
 * @returns A promise that resolves to an `AsyncIOResult` containing the created path.
 * @example
 * ```typescript
 * // Create a temporary file
 * const result = await mkTemp();
 * if (result.isOk()) {
 *     console.log(result.unwrap()); // '/tmp/tmp-550e8400-e29b-41d4-a716-446655440000'
 * }
 *
 * // Create a temporary directory
 * const dirResult = await mkTemp({ isDirectory: true });
 *
 * // Create with custom basename and extension
 * const customResult = await mkTemp({ basename: 'cache', extname: '.json' });
 * ```
 */
export async function mkTemp(options?: TempOptions): AsyncIOResult<string> {
    const {
        isDirectory = false,
    } = options ?? {};

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
 * const result = await deleteTemp();
 * if (result.isOk()) {
 *     console.log('Temporary directory deleted');
 * }
 * ```
 */
export function deleteTemp(): AsyncVoidIOResult {
    return remove(TMP_DIR);
}

/**
 * Removes expired files from the temporary directory.
 * Only removes files whose `lastModified` time is before the specified date.
 *
 * **Note:** This function only removes files, not empty directories.
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

    const readDirRes = await readDir(TMP_DIR, {
        recursive: true,
    });

    return readDirRes.andThenAsync(async entries => {
        try {
            for await (const { handle } of entries) {
                if (isFileHandle(handle) && (await handle.getFile()).lastModified <= expired.getTime()) {
                    // TODO ts not support yet
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    await (handle as any).remove();
                }
            }
        } catch (e) {
            return Err(e as DOMException);
        }

        return RESULT_VOID;
    });
}