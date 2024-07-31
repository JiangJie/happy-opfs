export { TIMEOUT_ERROR } from '@happy-ts/fetch-t';

/**
 * A constant representing the error thrown when a file or directory is not found.
 * Name of DOMException.NOT_FOUND_ERR.
 */
export const NOT_FOUND_ERROR = 'NotFoundError' as const;

/**
 * Represents the possible content types that can be written to a file.
 */
export type WriteFileContent = BufferSource | Blob | string;

/**
 * Represents the possible content types that can be read from a file.
 */
export type ReadFileContent = ArrayBuffer | Blob | string;

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
export interface FsRequestInit extends RequestInit {
    /**
     * Specifies the maximum time in milliseconds to wait for the fetch request to complete.
     */
    timeout?: number;
}

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
     * The binary data of the file.
     */
    data: Uint8Array;
}

/**
 * Setup options of the main messenger.
 */
export interface MainMessengerOptions {
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