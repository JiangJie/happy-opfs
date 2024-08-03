import type { FileSystemFileHandleLike, FileSystemHandleLike } from './defines.ts';

/**
 * Serialize a `FileSystemHandle` to plain object.
 * @param handle - `FileSystemHandle` object.
 * @returns Serializable version of FileSystemHandle that is FileSystemHandleLike.
 */
export async function toFileSystemHandleLike(handle: FileSystemHandle): Promise<FileSystemHandleLike> {
    const { name, kind } = handle;

    if (kind === 'file') {
        const file = await (handle as FileSystemFileHandle).getFile();
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