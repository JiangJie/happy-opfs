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