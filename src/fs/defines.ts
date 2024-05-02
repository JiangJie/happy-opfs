import type { Result } from '@happy-js/happy-rusty';

/**
 * file content type for write, support `ArrayBuffer` `TypedArray` `Blob` `string`.
 */
export type WriteFileContent = BufferSource | Blob | string;

/**
 * file content type for read result, support `ArrayBuffer` `Blob` `string`.
 */
export type ReadFileContent = ArrayBuffer | Blob | string;

/**
 * read file options
 */
export interface ReadOptions {
    /**
     * read file encoding type, support `binary(ArrayBuffer)` `utf8(string)` `blob(Blob)`
     *
     * @default {FileEncoding.binary}
     */
    encoding?: FileEncoding;
}

/**
 * write file options
 */
export interface WriteOptions {
    /**
     * create file if not exists
     *
     * @default {true}
     */
    create?: boolean;
    /**
     * append mode
     *
     * @default {false}
     */
    append?: boolean;
}

/**
 * options to check path exists
 */
export interface ExistsOptions {
    /**
     * check directory exists
     *
     * @default {false}
     */
    isDirectory?: boolean;
    /**
     * check file exists
     *
     * @default {false}
     */
    isFile?: boolean;
}

/**
 * type alias of Promise Result
 */
export type FsAsyncResult<T> = Promise<Result<T, Error>>;

/**
 * read file encoding type
 */
export const enum FileEncoding {
    binary = 'binary',
    utf8 = 'utf8',
    blob = 'blob',
}