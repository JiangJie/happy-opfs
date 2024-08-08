import type { FileSystemFileHandleLike, FileSystemHandleLike } from './defines.ts';

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