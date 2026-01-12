/**
 * Internal validation functions for async operations.
 * These functions return Result types instead of throwing exceptions.
 *
 * @internal
 * @module
 */

import { normalize } from '@std/path/posix';
import { Err, Ok, RESULT_VOID, type IOResult, type VoidIOResult } from 'happy-rusty';
import { ROOT_DIR, type ExistsOptions } from '../../shared/mod.ts';

/**
 * Validates that the provided path is an absolute path and normalizes it.
 * Returns a Result instead of throwing.
 *
 * @param path - The file path to validate.
 * @returns An `IOResult` containing the normalized absolute path, or an error.
 */
export function validateAbsolutePath(path: string): IOResult<string> {
    if (typeof path !== 'string') {
        return Err(new TypeError(`path must be a string but received ${ typeof path }`));
    }

    if (path[0] !== ROOT_DIR) {
        return Err(new Error(`path must be absolute (start with '/'): '${ path }'`));
    }

    // Normalize and remove trailing slash except for root
    const normalized = normalize(path);
    const result = normalized.length > 1 && normalized[normalized.length - 1] === ROOT_DIR
        ? normalized.slice(0, -1)
        : normalized;

    return Ok(result);
}

/**
 * Validates that the provided URL is valid and returns a URL object.
 * Supports relative URLs by using current location as base.
 * Returns a Result instead of throwing.
 *
 * @param url - The URL string or URL object to validate.
 * @returns An `IOResult` containing the URL object, or an error.
 */
export function validateUrl(url: string | URL): IOResult<URL> {
    if (url instanceof URL) {
        return Ok(url);
    }

    try {
        return Ok(new URL(url, location.href));
    } catch {
        return Err(new TypeError(`url is invalid: '${ url }'`));
    }
}

/**
 * Validates that the provided ExistsOptions are valid.
 * `isDirectory` and `isFile` cannot both be `true`.
 *
 * @param options - The ExistsOptions to validate.
 * @returns A `VoidIOResult` indicating success, or an error if options are invalid.
 */
export function validateExistsOptions(options?: ExistsOptions): VoidIOResult {
    const { isDirectory = false, isFile = false } = options ?? {};
    if (isDirectory && isFile) {
        return Err(new Error('isDirectory and isFile cannot both be true'));
    }
    return RESULT_VOID;
}

/**
 * Validates that the provided value is a valid Date for pruneTemp expiration.
 * Returns a Result instead of throwing.
 *
 * @param expired - The Date to validate.
 * @returns A `VoidIOResult` indicating success, or an error if not a Date instance.
 */
export function validateExpiredDate(expired: Date): VoidIOResult {
    if (expired instanceof Date) {
        return RESULT_VOID;
    }
    return Err(new TypeError(`expired must be a Date but received ${ typeof expired }`));
}
