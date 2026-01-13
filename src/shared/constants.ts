export { ABORT_ERROR, TIMEOUT_ERROR } from '@happy-ts/fetch-t';

/**
 * A constant representing the error thrown when a file or directory is not found.
 * Name of DOMException.NOT_FOUND_ERR.
 */
export const NOT_FOUND_ERROR = 'NotFoundError' as const;

/**
 * Response body is empty (null), typically from 204/304 responses or HEAD requests.
 */
export const EMPTY_BODY_ERROR = 'EmptyBodyError' as const;

/**
 * File content is empty (0 bytes).
 */
export const EMPTY_FILE_ERROR = 'EmptyFileError' as const;

/**
 * A constant representing the root directory path.
 */
export const ROOT_DIR = '/' as const;

/**
 * A constant representing the temporary directory path.
 */
export const TMP_DIR = '/tmp' as const;