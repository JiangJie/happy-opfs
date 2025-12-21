/**
 * Serializable version of File.
 */
export interface FileLike {
    /**
     * The name of the file.
     */
    readonly name: string;

    /**
     * The type of the file.
     */
    readonly type: string;

    /**
     * The last modified time of the file.
     */
    readonly lastModified: number;

    /**
     * The size of the file.
     */
    readonly size: number;

    /**
     * The binary data of the file.
     */
    readonly data: number[];
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