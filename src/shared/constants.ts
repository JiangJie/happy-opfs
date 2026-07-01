export { ABORT_ERROR, TIMEOUT_ERROR } from '@happy-ts/fetch-t';

/**
 * A constant representing the error thrown when a file or directory is not found.
 * Name of DOMException.NOT_FOUND_ERR.
 *
 * @since 1.0.0
 */
export const NOT_FOUND_ERROR = 'NotFoundError' as const;

/**
 * Response body is empty (null), typically from 204/304 responses or HEAD requests.
 *
 * @since 2.0.0
 */
export const EMPTY_BODY_ERROR = 'EmptyBodyError' as const;

/**
 * File content is empty (0 bytes).
 *
 * @since 2.0.0
 */
export const EMPTY_FILE_ERROR = 'EmptyFileError' as const;

/**
 * Nothing to zip - empty directory with no entries.
 *
 * @since 2.0.0
 */
export const NOTHING_TO_ZIP_ERROR = 'NothingToZipError' as const;

/**
 * A constant representing the root directory path.
 *
 * @since 1.0.0
 */
export const ROOT_DIR = '/' as const;

/**
 * A constant representing the temporary directory path.
 *
 * @since 1.7.0
 */
export const TMP_DIR = '/tmp' as const;