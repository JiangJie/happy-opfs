export { ABORT_ERROR, TIMEOUT_ERROR } from '@happy-ts/fetch-t';

/**
 * A constant representing the error thrown when a file or directory is not found.
 * Name of DOMException.NOT_FOUND_ERR.
 */
export const NOT_FOUND_ERROR = 'NotFoundError' as const;

/**
 * A constant representing the root directory path.
 */
export const ROOT_DIR = '/' as const;

/**
 * A constant representing the current directory path.
 */
export const CURRENT_DIR = '.' as const;