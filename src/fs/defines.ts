import type { FetchInit } from '@happy-ts/fetch-t';

/**
 * Represents the possible content types that can be written to a file asynchronously.
 * Includes `BufferSource` (ArrayBuffer or TypedArray), `Blob`, or `string`.
 */
export type WriteFileContent = BufferSource | Blob | string;

/**
 * Represents the possible content types that can be written to a file synchronously.
 * Excludes `Blob` since it requires async operations to read.
 */
export type WriteSyncFileContent = BufferSource | string;

/**
 * Represents the possible content types that can be read from a file.
 * The actual type depends on the `encoding` option:
 * - `'binary'`: `ArrayBuffer`
 * - `'utf8'`: `string`
 * - `'blob'`: `File`
 */
export type ReadFileContent = ArrayBuffer | File | string;

/**
 * Options for reading files with specified encoding.
 */
export interface ReadOptions {
    /**
     * The encoding to use for reading the file's content.
     * @defaultValue `'binary'`
     */
    encoding?: FileEncoding;
}

/**
 * Options for writing files, including flags for creation and appending.
 */
export interface WriteOptions {
    /**
     * Whether to create the file if it does not exist.
     * @defaultValue `true`
     */
    create?: boolean;

    /**
     * Whether to append to the file if it already exists.
     * @defaultValue `false`
     */
    append?: boolean;
}

/**
 * Options to determine the existence of a file or directory.
 */
export interface ExistsOptions {
    /**
     * Whether to check for the existence of a directory.
     * @defaultValue `false`
     */
    isDirectory?: boolean;

    /**
     * Whether to check for the existence of a file.
     * @defaultValue `false`
     */
    isFile?: boolean;
}

/**
 * Supported file encodings for reading files.
 * - `'binary'`: Returns raw `ArrayBuffer`
 * - `'utf8'`: Returns decoded `string`
 * - `'blob'`: Returns `File` object with metadata
 */
export type FileEncoding = 'binary' | 'utf8' | 'blob';

/**
 * fetch-t options for download and upload.
 */
export type FsRequestInit = Omit<FetchInit, 'abortable' | 'responseType'>;

/**
 * fetch-t request options for uploading files.
 */
export interface UploadRequestInit extends FsRequestInit {
    /**
     * The filename to use when uploading the file.
     */
    filename?: string;
}

/**
 * Options for reading directories.
 */
export interface ReadDirOptions {
    /**
     * Whether to recursively read the contents of subdirectories.
     * @defaultValue `false`
     */
    recursive?: boolean;
}

/**
 * An entry returned by `readDir`.
 */
export interface ReadDirEntry {
    /**
     * The relative path of the entry from the `readDir` path parameter.
     * For non-recursive reads, this is just the entry name.
     * For recursive reads, this includes the subdirectory path.
     */
    readonly path: string;

    /**
     * The `FileSystemHandle` of the entry.
     * Use `isFileHandle()` or `isDirectoryHandle()` to determine the type.
     */
    readonly handle: FileSystemHandle;
}

/**
 * An entry returned by `readDirSync`.
 * Similar to `ReadDirEntry` but uses serializable `FileSystemHandleLike`.
 */
export interface ReadDirEntrySync {
    /**
     * The relative path of the entry from the `readDirSync` path parameter.
     */
    readonly path: string;

    /**
     * The serializable handle-like object of the entry.
     * Use `isFileHandleLike()` to check if it's a file.
     */
    readonly handle: FileSystemHandleLike;
}

/**
 * A serializable representation of a file or directory handle.
 * Returned by `statSync` and used in `ReadDirEntrySync`.
 */
export interface FileSystemHandleLike {
    /**
     * The name of the file or directory.
     */
    readonly name: string;

    /**
     * The kind of the entry: `'file'` or `'directory'`.
     */
    readonly kind: FileSystemHandleKind;
}

/**
 * A serializable representation of a file handle with additional metadata.
 * Extends `FileSystemHandleLike` with file-specific properties.
 */
export interface FileSystemFileHandleLike extends FileSystemHandleLike {
    /**
     * The MIME type of the file (e.g., `'text/plain'`, `'image/png'`).
     */
    readonly type: string;

    /**
     * The size of the file in bytes.
     */
    readonly size: number;

    /**
     * The last modified timestamp in milliseconds since Unix epoch.
     */
    readonly lastModified: number;
}

/**
 * Setup options for `connectSyncAgent`.
 */
export interface SyncAgentOptions {
    /**
     * The worker to communicate with.
     * Can be a `Worker` instance, a `URL`, or a URL string.
     */
    worker: Worker | URL | string;

    /**
     * The size of the `SharedArrayBuffer` in bytes.
     * Larger buffers can handle larger file operations but consume more memory.
     * Must be a multiple of 4 and greater than 16.
     * @defaultValue `1048576` (1MB)
     */
    bufferLength?: number;

    /**
     * The timeout for each synchronous operation in milliseconds.
     * If an operation takes longer than this, a `TimeoutError` is thrown.
     * @defaultValue `1000` (1 second)
     */
    opTimeout?: number;
}

/**
 * Options for `zip`.
 */
export interface ZipOptions {
    /**
     * Whether to preserve the root directory name in the zip file structure.
     * - `true`: `/path/to/folder` → `folder/file1.txt`, `folder/file2.txt`
     * - `false`: `/path/to/folder` → `file1.txt`, `file2.txt`
     * @defaultValue `true`
     */
    preserveRoot?: boolean;
}

/**
 * Options for `mkTemp`.
 */
export interface TempOptions {
    /**
     * Whether to create a directory.
     * eg: `mktemp -d`
     * @defaultValue `false`
     */
    isDirectory?: boolean;

    /**
     * The basename of the file or directory.
     * eg: `mktemp -t basename.XXX`
     * @defaultValue `tmp`
     */
    basename?: string;

    /**
     * The extension of the file.
     * eg: `mktemp --suffix .txt`
     */
    extname?: string;
}

/**
 * Options for `copy`.
 */
export interface CopyOptions {
    /**
     * Whether to overwrite the destination file if it already exists.
     * @defaultValue `true`
     */
    overwrite?: boolean;
}

/**
 * Result of `downloadFile` when the file is saved to a temporary path.
 */
export interface DownloadFileTempResponse {
    /**
     * The temporary path of the downloaded file to be saved.
     */
    readonly tempFilePath: string;

    /**
     * The raw response.
     */
    readonly rawResponse: Response;
}

/**
 * Options for `move`.
 */
export interface MoveOptions {
    /**
     * Whether to overwrite the destination file if it already exists.
     * @defaultValue `true`
     */
    overwrite?: boolean;
}