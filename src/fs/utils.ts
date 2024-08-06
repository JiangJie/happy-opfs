import type { FileSystemFileHandleLike, FileSystemHandleLike } from './defines.ts';

/**
 * Serialize a `FileSystemHandle` to plain object.
 * @param handle - `FileSystemHandle` object.
 * @returns Serializable version of FileSystemHandle that is FileSystemHandleLike.
 */
export async function toFileSystemHandleLike(handle: FileSystemHandle): Promise<FileSystemHandleLike> {
    const { name, kind } = handle;

    if (isFileKind(kind)) {
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

/**
 * Whether the handle is a file.
 * @param kind - The handle kind.
 * @returns `true` if the handle is a file, otherwise `false`.
 */
export function isFileKind(kind: FileSystemHandleKind): boolean {
    return kind === 'file';
}

/**
 * Whether the handle is a directory.
 * @param kind - The handle kind.
 * @returns `true` if the handle is a directory, otherwise `false`.
 */
export function isDirectoryKind(kind: FileSystemHandleKind): boolean {
    return kind === 'directory';
}

/**
 * Gets the data of a file handle.
 * @param handle - The file handle.
 * @returns A promise that resolves to the data of the file.
 */
export async function getFileDataByHandle(handle: FileSystemHandle): Promise<Uint8Array> {
    const file = await (handle as FileSystemFileHandle).getFile();
    const ab = await file.arrayBuffer();
    const data = new Uint8Array(ab);
    return data;
}