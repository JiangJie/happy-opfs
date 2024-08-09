import type { FetchInit } from '@happy-ts/fetch-t';

/**
 * Represents the possible content types that can be written to a file.
 */
export type WriteFileContent = BufferSource | Blob | string;

/**
 * Represents the possible content types that can be written synchronously to a file.
 */
export type WriteSyncFileContent = BufferSource | string;

/**
 * Represents the possible content types that can be read from a file.
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
 * Supported file encodings for reading and writing files.
 */
export type FileEncoding = 'binary' | 'utf8' | 'blob';

/**
 * fetch-t options for download and upload.
 */
export type FsRequestInit = Omit<FetchInit, 'abortable' | 'responseType'>

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
     * Whether to recursively read the contents of directories.
     */
    recursive: boolean;
}

/**
 * An entry returned by `readDir`.
 */
export interface ReadDirEntry {
    /**
     * The relative path of the entry from readDir the path parameter.
     */
    path: string;

    /**
     * The handle of the entry.
     */
    handle: FileSystemHandle;
}

/**
 * An entry returned by `readDirSync`.
 */
export interface ReadDirEntrySync {
    /**
     * The relative path of the entry from readDir the path parameter.
     */
    path: string;

    /**
     * The handle of the entry.
     */
    handle: FileSystemHandleLike;
}

/**
 * A handle to a file or directory returned by `statSync`.
 */
export interface FileSystemHandleLike {
    /**
     * The name of the entry.
     */
    name: string;

    /**
     * The kind of the entry.
     */
    kind: FileSystemHandleKind;
}

export interface FileSystemFileHandleLike extends FileSystemHandleLike {
    /**
     * The type of the file.
     */
    type: string;

    /**
     * The size of the file.
     */
    size: number;

    /**
     * The last modified time of the file.
     */
    lastModified: number;
}

/**
 * Serializable version of Error.
 */
export interface ErrorLike {
    /**
     * The name of the error.
     */
    name: string;

    /**
     * The message of the error.
     */
    message: string;
}

/**
 * Serializable version of File.
 */
export interface FileLike {
    /**
     * The name of the file.
     */
    name: string;

    /**
     * The type of the file.
     */
    type: string;

    /**
     * The last modified time of the file.
     */
    lastModified: number;

    /**
     * The size of the file.
     */
    size: number;

    /**
     * The binary data of the file.
     */
    data: ArrayBuffer;
}

/**
 * Setup options of `connectSyncAgent`.
 */
export interface SyncAgentOptions {
    /**
     * The worker to communicate with.
     */
    worker: Worker | URL | string;

    /**
     * The length of the buffer to use for communication.
    */
    bufferLength?: number;

    /**
     * The timeout for operations.
     */
    opTimeout?: number;
}

/**
 * Options for `zip`.
 */
export interface ZipOptions {
    /**
     * Whether to preserve the root directory in the zip file.
     * @defaultValue `true`
     */
    preserveRoot: boolean;
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
    tempFilePath: string;

    /**
     * The raw response.
     */
    rawResponse: Response;
}