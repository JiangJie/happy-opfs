import type { FileSystemFileHandleLike, FileSystemHandleLike } from './defines.ts';

/**
 * Checks whether the given handle is a file handle.
 *
 * @param handle - The `FileSystemHandle` to check.
 * @returns `true` if the handle is a `FileSystemFileHandle`, otherwise `false`.
 * @example
 * ```typescript
 * (await stat('/path/to/file'))
 *     .inspect(handle => isFileHandle(handle) && console.log('This is a file'));
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
 * (await stat('/path/to/dir'))
 *     .inspect(handle => isDirectoryHandle(handle) && console.log('This is a directory'));
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
 * statSync('/path/to/file')
 *     .inspect(handle => isFileHandleLike(handle) && console.log(`File size: ${handle.size}`));
 * ```
 */
export function isFileHandleLike(handle: FileSystemHandleLike): handle is FileSystemFileHandleLike {
    return handle.kind === 'file';
}
