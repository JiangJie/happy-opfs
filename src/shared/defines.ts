import type { FetchInit } from '@happy-ts/fetch-t';

// ==================== File Content Types ====================

/**
 * Represents the possible content types that can be written to a file asynchronously.
 * Includes `BufferSource` (ArrayBuffer or TypedArray), `Blob`, `string`, or a binary `ReadableStream`.
 */
export type WriteFileContent = BufferSource | Blob | string | ReadableStream<Uint8Array<ArrayBuffer>>;

/**
 * Represents the possible content types that can be written to a file synchronously.
 * Excludes `Blob` (requires async read) and `ReadableStream` (inherently async).
 */
export type WriteSyncFileContent = Exclude<WriteFileContent, Blob | ReadableStream<Uint8Array<ArrayBuffer>>>;

/**
 * Represents the possible content types that can be read from a file.
 * The actual type depends on the `encoding` option:
 * - `'bytes'` (default): `Uint8Array`
 * - `'utf8'`: `string`
 * - `'blob'`: `File`
 * - `'stream'`: `ReadableStream<Uint8Array>`
 */
export type ReadFileContent = Uint8Array<ArrayBuffer> | File | string | ReadableStream<Uint8Array<ArrayBuffer>>;

/**
 * Represents the possible content types for synchronous file reads.
 * Excludes `ReadableStream` since it cannot be returned synchronously.
 */
export type ReadSyncFileContent = Exclude<ReadFileContent, ReadableStream<Uint8Array<ArrayBuffer>>>;

/**
 * Supported file encodings for reading files.
 * - `'bytes'` (default): Returns `Uint8Array`
 * - `'utf8'`: Returns decoded `string`
 * - `'blob'`: Returns `File` object with metadata
 * - `'stream'`: Returns `ReadableStream<Uint8Array>` for streaming reads
 */
export type FileEncoding = 'bytes' | 'utf8' | 'blob' | 'stream';

/**
 * Supported file encodings for synchronous file reads.
 * Excludes `'stream'` since `ReadableStream` cannot be returned synchronously.
 */
export type FileSyncEncoding = Exclude<FileEncoding, 'stream'>;

// ==================== Core Operation Options ====================

/**
 * Options for reading files with specified encoding.
 */
export interface ReadOptions {
    /**
     * The encoding to use for reading the file's content.
     * @defaultValue `'bytes'`
     */
    encoding?: FileEncoding;
}

/**
 * Options for reading files synchronously.
 */
export interface ReadSyncOptions {
    /**
     * The encoding to use for reading the file's content.
     * Excludes `'stream'` since `ReadableStream` cannot be returned synchronously.
     * @defaultValue `'bytes'`
     */
    encoding?: FileSyncEncoding;
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
 * Options for reading directories synchronously.
 */
export interface ReadDirSyncOptions {
    /**
     * Whether to recursively read the contents of subdirectories.
     * @defaultValue `false`
     */
    recursive?: boolean;
}

/**
 * Options for reading directories.
 */
export interface ReadDirOptions extends ReadDirSyncOptions {
    /**
     * An optional `AbortSignal` to abort the directory traversal.
     * When aborted, the iterator will stop yielding entries.
     */
    signal?: AbortSignal;
}

/**
 * Options to determine the existence of a file or directory.
 *
 * The `isDirectory` and `isFile` options are mutually exclusive.
 * Setting both to `true` will result in a compile-time error (and runtime error as fallback).
 *
 * @example
 * ```typescript
 * // Check if path exists (any type)
 * await exists('/path');
 *
 * // Check if path exists and is a directory
 * await exists('/path', { isDirectory: true });
 *
 * // Check if path exists and is a file
 * await exists('/path', { isFile: true });
 * ```
 */
export type ExistsOptions =
    | {
        /**
         * Whether to check for the existence of a directory.
         * @defaultValue `false`
         */
        isDirectory?: boolean;
        /**
         * Must be `false` or omitted when `isDirectory` is `true`.
         * @defaultValue `false`
         */
        isFile?: false;
    }
    | {
        /**
         * Must be `false` or omitted when `isFile` is `true`.
         * @defaultValue `false`
         */
        isDirectory?: false;
        /**
         * Whether to check for the existence of a file.
         * @defaultValue `false`
         */
        isFile?: boolean;
    };

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
 * Options for `move`.
 */
export interface MoveOptions {
    /**
     * Whether to overwrite the destination file if it already exists.
     * @defaultValue `true`
     */
    overwrite?: boolean;
}

// ==================== Directory Entry Types ====================

/**
 * An entry returned by `readDir`.
 */
export interface DirEntry {
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
 * Serializable version of `DirEntry`.
 *
 * Unlike `DirEntry` which contains a native `FileSystemHandle`, this interface
 * uses `FileSystemHandleLike` which can be serialized to JSON for cross-thread
 * communication via `SharedArrayBuffer`.
 *
 * **Why this type exists:**
 * Native `FileSystemHandle` objects cannot be transferred between the main thread
 * and Web Workers through JSON serialization. This type provides a plain object
 * alternative that preserves the essential information.
 *
 * **When it's used:**
 * - Returned by `readDirSync()` in the sync API
 * - Internally used when worker sends directory entries back to main thread
 */
export interface DirEntryLike {
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
 * Serializable version of `FileSystemHandle`.
 *
 * Contains only the basic properties (`name`, `kind`) that identify a file system entry.
 * For file entries, use `FileSystemFileHandleLike` which includes additional metadata.
 *
 * **Why this type exists:**
 * Native `FileSystemHandle` is a browser API object with methods like `getFile()`,
 * `createWritable()`, etc. These methods and internal state cannot be serialized.
 * This type extracts only the serializable properties for cross-thread communication.
 *
 * **When it's used:**
 * - Returned by `statSync()` for directory entries
 * - Used as the `handle` property in `DirEntryLike`
 * - Internally converted from `FileSystemHandle` via `serializeFileSystemHandle()`
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
 * Serializable version of `FileSystemFileHandle` with file metadata.
 *
 * Extends `FileSystemHandleLike` with file-specific properties that are normally
 * obtained by calling `handle.getFile()` on a native `FileSystemFileHandle`.
 *
 * **Why this type exists:**
 * To provide file metadata (size, type, lastModified) without requiring async
 * operations. The native API requires `await handle.getFile()` to access these
 * properties, but this type pre-fetches and stores them.
 *
 * **When it's used:**
 * - Returned by `statSync()` for file entries
 * - Used in `DirEntryLike.handle` when the entry is a file
 * - Use `isFileHandleLike()` to narrow from `FileSystemHandleLike`
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

// ==================== Temporary File Options ====================

/**
 * Options for `mkTemp`.
 *
 * The `isDirectory` and `extname` options are mutually exclusive.
 * Setting both will result in a compile-time error; at runtime `extname` is ignored for directories.
 *
 * @example
 * ```typescript
 * // Create a temporary file
 * await mkTemp();
 *
 * // Create a temporary directory
 * await mkTemp({ isDirectory: true });
 *
 * // Create a temporary file with extension
 * await mkTemp({ extname: '.txt' });
 * ```
 */
export type TempOptions =
    | {
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
         * Must be omitted when `isDirectory` is `true`.
         */
        extname?: never;
    }
    | {
        /**
         * Must be `false` or omitted when `extname` is provided.
         * @defaultValue `false`
         */
        isDirectory?: false;

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
    };

// ==================== Archive Options ====================

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

// ==================== Network Types ====================

/**
 * Request init options for network-related APIs.
 *
 * This type is based on `@happy-ts/fetch-t` and is used by:
 * - {@link downloadFile}
 * - {@link uploadFile}
 * - {@link zipFromUrl}
 * - {@link unzipFromUrl}
 *
 * It supports `timeout` and `onProgress` (see fetch-t docs for exact semantics).
 */
export type FsRequestInit = Omit<FetchInit, 'abortable' | 'responseType'>;

/**
 * Request init options for {@link uploadFile}.
 */
export interface UploadRequestInit extends FsRequestInit {
    /**
     * The filename to use when uploading the file.
     */
    filename?: string;
}

/**
 * Request init options for {@link downloadFile}.
 */
export interface DownloadRequestInit extends FsRequestInit {
    /**
     * Whether to keep empty response body (0 bytes) and save as an empty file.
     * - `true`: Empty response saves as an empty file
     * - `false`: Empty response returns an `EmptyBodyError`
     * @defaultValue `false`
     */
    keepEmptyBody?: boolean;
}

/**
 * Request init options for {@link zipFromUrl}.
 */
export interface ZipFromUrlRequestInit extends FsRequestInit {
    /**
     * The filename to use in the zip archive.
     * Defaults to the basename of the URL pathname, or 'file' if the pathname is '/'.
     */
    filename?: string;

    /**
     * Whether to keep empty response body (0 bytes) and create a zip with an empty file entry.
     * - `true`: Empty response creates a zip with an empty file entry
     * - `false`: Empty response returns an `EmptyBodyError`
     * @defaultValue `false`
     */
    keepEmptyBody?: boolean;
}

/**
 * Request init options for {@link unzipFromUrl} and {@link unzipStreamFromUrl}.
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface UnzipFromUrlRequestInit extends FsRequestInit { }

/**
 * Result of {@link downloadFile} when the file is saved to a temporary path.
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

// ==================== Sync Channel Options ====================

/**
 * Options for `SyncChannel.connect`.
 */
export interface ConnectSyncChannelOptions {
    /**
     * The size of the `SharedArrayBuffer` in bytes.
     * Larger buffers can handle larger file operations but consume more memory.
     * Must be a multiple of 4 and at least 256 bytes.
     * @defaultValue `1048576` (1MB)
     */
    sharedBufferLength?: number;

    /**
     * The timeout for each synchronous operation in milliseconds.
     * If an operation takes longer than this, a `TimeoutError` is thrown.
     * @defaultValue `1000` (1 second)
     */
    opTimeout?: number;
}

/**
 * Options for `SyncChannel.attach`.
 */
export interface AttachSyncChannelOptions {
    /**
     * The timeout for each synchronous operation in milliseconds.
     * If an operation takes longer than this, a `TimeoutError` is thrown.
     * @defaultValue `1000` (1 second)
     */
    opTimeout?: number;
}
