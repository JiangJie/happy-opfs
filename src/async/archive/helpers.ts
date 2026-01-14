/**
 * Internal helper utilities for archive operations.
 *
 * @internal
 * @module
 */

import { Err, type AsyncIOResult } from 'happy-rusty';
import { exists } from '../ext.ts';
import { validateAbsolutePath } from '../internal/mod.ts';

/**
 * Empty bytes constant, used for directory entries in zip or empty file content.
 */
export const EMPTY_BYTES: Uint8Array<ArrayBuffer> = new Uint8Array(0);

/**
 * Validates that destDir is an absolute path and is not an existing file.
 * If destDir doesn't exist, that's fine (it will be created).
 * If destDir exists and is a directory, that's fine.
 * If destDir exists and is a file, return an error.
 *
 * @param destDir - The destination directory path to validate.
 * @returns An `AsyncIOResult` containing the normalized path, or an error.
 */
export async function validateDestDir(destDir: string): AsyncIOResult<string> {
    const pathRes = validateAbsolutePath(destDir);
    if (pathRes.isErr()) return pathRes;
    destDir = pathRes.unwrap();

    const existsRes = await exists(destDir, { isFile: true });

    return existsRes.andThen(isFile => {
        return isFile
            ? Err(new Error(`destDir '${ destDir }' exists but is a file, not a directory`))
            : pathRes;
    });
}
