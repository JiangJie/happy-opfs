import { basename } from '@std/path/posix';
import { tryAsyncResult, type AsyncIOResult } from 'happy-rusty';
import { getParentDirHandle, isRootDir, validateAbsolutePath } from '../internal/mod.ts';

/**
 * Retrieves the `FileSystemHandle` for a file or directory at the specified path.
 * Can be used to check the type (file or directory) and access metadata.
 *
 * @param path - The absolute path of the file or directory.
 * @returns A promise that resolves to an `AsyncIOResult` containing the `FileSystemHandle`.
 * @since 1.0.0
 * @example
 * ```typescript
 * (await stat('/path/to/entry'))
 *     .inspect(handle => console.log(`Kind: ${handle.kind}, Name: ${handle.name}`));
 * ```
 */
export async function stat(path: string): AsyncIOResult<FileSystemHandle> {
    const pathRes = validateAbsolutePath(path);
    if (pathRes.isErr()) return pathRes.asErr();
    path = pathRes.unwrap();

    const dirHandleRes = await getParentDirHandle(path);
    if (isRootDir(path)) {
        // root
        return dirHandleRes;
    }

    return dirHandleRes.andThenAsync(async dirHandle => {
        // Try to get the handle directly instead of iterating
        // First try as file, then as directory
        const childName = basename(path);
        let findRes = await tryAsyncResult<FileSystemHandle, DOMException>(dirHandle.getFileHandle(childName));
        if (findRes.isOk()) {
            return findRes;
        }

        // Not a file, try as directory
        findRes = await tryAsyncResult<FileSystemHandle, DOMException>(dirHandle.getDirectoryHandle(childName));

        return findRes.mapErr(err => {
            const error = new Error(`${ err.name }: '${ childName }' does not exist. Full path is '${ path }'`);
            error.name = err.name;
            return error;
        });
    });
}
