import { normalize } from '@std/path/posix';
import { Err, Ok, type IOResult } from 'happy-rusty';
import invariant from 'tiny-invariant';
import { ROOT_DIR, type ExistsOptions } from '../../shared/mod.ts';

/**
 * Validates that the provided path is an absolute path and normalizes it.
 * Returns a Result instead of throwing.
 *
 * @param path - The file path to validate.
 * @returns An `IOResult` containing the normalized absolute path, or an error.
 * @internal
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
 * @internal
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
 * Asserts that the provided ExistsOptions are valid.
 * `isDirectory` and `isFile` cannot both be `true`.
 *
 * @param options - The ExistsOptions to validate.
 * @throws Will throw an error if both `isDirectory` and `isFile` are `true`.
 * @internal
 */
export function assertExistsOptions(options?: ExistsOptions): void {
    const { isDirectory = false, isFile = false } = options ?? {};
    invariant(!(isDirectory && isFile), () => 'isDirectory and isFile cannot both be true');
}

/**
 * Asserts that the provided value is a valid Date for pruneTemp expiration.
 *
 * @param expired - The value to validate.
 * @throws Will throw an error if the value is not a Date instance.
 * @internal
 */
export function assertExpiredDate(expired: unknown): asserts expired is Date {
    invariant(expired instanceof Date, () => `expired must be a Date but received ${ expired }`);
}
