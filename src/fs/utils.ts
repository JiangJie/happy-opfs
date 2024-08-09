import { join, SEPARATOR } from '@std/path/posix';
import { TMP_DIR } from './constants.ts';
import type { FileSystemFileHandleLike, FileSystemHandleLike, TempOptions } from './defines.ts';

/**
 * Generate a temporary path but not create it.
 *
 * @param options - Options and flags.
 * @returns The temporary path.
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
 * Check whether the path is a temporary path.
 * @param path - The path to check.
 * @returns `true` if the path is a temporary path otherwise `false`.
 */
export function isTempPath(path: string): boolean {
    return path.startsWith(`${ TMP_DIR }${ SEPARATOR }`);
}

/**
 * Serialize a `FileSystemHandle` to plain object.
 * @param handle - `FileSystemHandle` object.
 * @returns Serializable version of FileSystemHandle that is FileSystemHandleLike.
 */
export async function toFileSystemHandleLike(handle: FileSystemHandle): Promise<FileSystemHandleLike> {
    const { name, kind } = handle;

    if (isFileHandle(handle)) {
        const file = await handle.getFile();
        const { size, lastModified, type } = file;

        const fileHandle: FileSystemFileHandleLike = {
            name,
            kind,
            type,
            size,
            lastModified,
        };

        return fileHandle;
    }

    const handleLike: FileSystemHandleLike= {
        name,
        kind,
    };

    return handleLike;
}

/**
 * Whether the handle is a file.
 * @param handle - The handle which is a FileSystemHandle.
 * @returns `true` if the handle is a file, otherwise `false`.
 */
export function isFileHandle(handle: FileSystemHandle): handle is FileSystemFileHandle {
    return handle.kind === 'file';
}

/**
 * Whether the handle is a directory.
 * @param handle - The handle which is a FileSystemHandle.
 * @returns `true` if the handle is a directory, otherwise `false`.
 */
export function isDirectoryHandle(handle: FileSystemHandle): handle is FileSystemDirectoryHandle {
    return handle.kind === 'directory';
}

/**
 * Whether the handle is a file-like.
 * @param handle -  The handle which is a FileSystemHandleLike.
 * @returns `true` if the handle is a file, otherwise `false`.
 */
export function isFileHandleLike(handle: FileSystemHandleLike): handle is FileSystemFileHandleLike {
    return handle.kind === 'file';
}

/**
 * Gets the data of a file handle.
 * @param handle - The file handle.
 * @returns A promise that resolves to the data of the file.
 */
export async function getFileDataByHandle(handle: FileSystemFileHandle): Promise<Uint8Array> {
    const file = await handle.getFile();
    const ab = await file.arrayBuffer();
    return new Uint8Array(ab);
}