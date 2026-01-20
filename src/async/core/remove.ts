import { basename } from '@std/path/posix';
import { Err, RESULT_VOID, type AsyncVoidIOResult } from 'happy-rusty';
import { validateAbsolutePath } from '../../shared/internal/mod.ts';
import { getParentDirHandle, isNotFoundError, isRootDir, removeHandle } from '../internal/mod.ts';

/**
 * Removes a file or directory at the specified path, similar to `rm -rf`.
 * If the path doesn't exist, the operation succeeds silently.
 *
 * @param path - The absolute path of the file or directory to remove.
 * @returns A promise that resolves to an `AsyncVoidIOResult` indicating success or failure.
 * @since 1.0.0
 * @see {@link removeSync} for synchronous version
 * @see {@link emptyDir} for emptying a directory without removing it
 * @see {@link deleteTemp} for removing the temporary directory
 * @example
 * ```typescript
 * (await remove('/path/to/file-or-directory'))
 *     .inspect(() => console.log('Removed successfully'));
 * ```
 */
export async function remove(path: string): AsyncVoidIOResult {
    const pathRes = validateAbsolutePath(path);
    if (pathRes.isErr()) return pathRes.asErr();
    path = pathRes.unwrap();

    const parentDirHandleRes = await getParentDirHandle(path);

    const removeRes = await parentDirHandleRes.andTryAsync(parentDirHandle => {
        // For root, parentDirHandle is the root itself
        // For non-root, use basename as the entry name
        const handleOrName = isRootDir(path) ? parentDirHandle : basename(path);
        return removeHandle(handleOrName, parentDirHandle, {
            recursive: true,
        });
    });

    return removeRes.orElse(err => {
        // not found as success
        return isNotFoundError(err) ? RESULT_VOID : Err(err);
    });
}
