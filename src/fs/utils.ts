import { join, SEPARATOR } from '@std/path/posix';
import { TMP_DIR } from './constants.ts';
import type { FileSystemFileHandleLike, FileSystemHandleLike, TempOptions } from './defines.ts';

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

    const handleLike: FileSystemHandleLike = {
        name,
        kind,
    };

    return handleLike;
}

/**
 * Checks whether the given handle is a file handle.
 *
 * @param handle - The `FileSystemHandle` to check.
 * @returns `true` if the handle is a `FileSystemFileHandle`, otherwise `false`.
 * @example
 * ```typescript
 * const handle = await stat('/path/to/file');
 * if (handle.isOk() && isFileHandle(handle.unwrap())) {
 *     console.log('This is a file');
 * }
 * ```
 */
export function isFileHandle(handle: FileSystemHandle): handle is FileSystemFileHandle {
    return handle.kind === 'file';
}

/**
 * Checks whether the given handle is a directory handle.
 *
 * @param handle - The `FileSystemHandle` to check.
 * @returns `true` if the handle is a `FileSystemDirectoryHandle`, otherwise `false`.
 * @example
 * ```typescript
 * const handle = await stat('/path/to/dir');
 * if (handle.isOk() && isDirectoryHandle(handle.unwrap())) {
 *     console.log('This is a directory');
 * }
 * ```
 */
export function isDirectoryHandle(handle: FileSystemHandle): handle is FileSystemDirectoryHandle {
    return handle.kind === 'directory';
}

/**
 * Checks whether the given handle-like object represents a file.
 *
 * @param handle - The `FileSystemHandleLike` object to check.
 * @returns `true` if the handle-like object represents a file, otherwise `false`.
 * @example
 * ```typescript
 * const handleLike = await statSync('/path/to/file').unwrap();
 * if (isFileHandleLike(handleLike)) {
 *     console.log(`File size: ${handleLike.size}`);
 * }
 * ```
 */
export function isFileHandleLike(handle: FileSystemHandleLike): handle is FileSystemFileHandleLike {
    return handle.kind === 'file';
}

/**
 * Reads the binary data from a file handle.
 *
 * @param handle - The `FileSystemFileHandle` to read from.
 * @returns A promise that resolves to the file content as a `Uint8Array`.
 * @internal
 */
export async function getFileDataByHandle(handle: FileSystemFileHandle): Promise<Uint8Array> {
    const file = await handle.getFile();
    const ab = await file.arrayBuffer();
    return new Uint8Array(ab);
}