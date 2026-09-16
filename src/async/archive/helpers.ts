/**
 * Internal helper utilities for archive operations.
 *
 * @internal
 * @module
 */

import { Err, RESULT_VOID, type AsyncIOResult, type VoidIOResult } from 'happy-rusty';
import { join, normalize, SEPARATOR, validateAbsolutePath } from '../../shared/internal/mod.ts';
import { ROOT_DIR } from '../../shared/mod.ts';
import { exists } from '../ext.ts';

/**
 * Empty bytes constant, used for directory entries in zip or empty file content.
 */
export const EMPTY_BYTES: Uint8Array<ArrayBuffer> = /*#__PURE__*/ new Uint8Array(0);

/**
 * Validates that an archive entry name stays inside the destination directory.
 *
 * Entry names come from the archive and are therefore untrusted: a name like
 * `../evil.txt` resolves outside of `destDir` and would overwrite unrelated
 * files in the origin private file system (zip-slip). Names that resolve to
 * `destDir` itself are accepted, because archives created by tools such as
 * `zip -r archive.zip .` legitimately contain such a root entry.
 *
 * @param entryName - The entry name as stored in the archive.
 * @param destDir - The normalized destination directory path.
 * @returns A `VoidIOResult` indicating whether the entry may be extracted.
 */
export function validateArchiveEntry(entryName: string, destDir: string): VoidIOResult {
    // `join` keeps absolute names inside destDir, but `..` segments can escape it
    const target = normalize(join(destDir, entryName));
    const isInside =
        target === destDir ||
        target.startsWith(destDir === ROOT_DIR ? ROOT_DIR : destDir + SEPARATOR);

    return isInside
        ? RESULT_VOID
        : Err(
              new Error(
                  `Archive entry '${entryName}' would escape the destination directory '${destDir}'`,
              ),
          );
}

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
        return isFile ? Err(new Error(`Path '${destDir}' is not a directory`)) : pathRes;
    });
}
