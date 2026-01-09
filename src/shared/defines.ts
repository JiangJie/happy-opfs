import type { FetchInit } from '@happy-ts/fetch-t';

/**
 * Represents the possible content types that can be written to a file asynchronously.
 * Includes `BufferSource` (ArrayBuffer or TypedArray), `Blob`, `string`, or a binary `ReadableStream`.
 */
export type WriteFileContent = BufferSource | Blob | string | ReadableStream<Uint8Array<ArrayBuffer>>;

/**
 * Represents the possible content types that can be written to a file synchronously.
 * Excludes `Blob` since it requires async operations to read.
 */
export type WriteSyncFileContent = BufferSource | string;

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
 * - `'bytes'` (default): Returns `Uint8Array`
 * - `'utf8'`: Returns decoded `string`
 * - `'blob'`: Returns `File` object with metadata
 * - `'stream'`: Returns `ReadableStream<Uint8Array>` for streaming reads
 */
export type FileEncoding = 'bytes' | 'utf8' | 'blob' | 'stream';

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
 * Options for reading directories.
 */
export interface ReadDirOptions {
    /**
     * Whether to recursively read the contents of subdirectories.
     * @defaultValue `false`
     */
    recursive?: boolean;

    /**
     * An optional `AbortSignal` to abort the directory traversal.
     * When aborted, the iterator will stop yielding entries.
     */
    signal?: AbortSignal;
}

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