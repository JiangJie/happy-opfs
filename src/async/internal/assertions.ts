import { normalize } from '@std/path/posix';
import invariant from 'tiny-invariant';
import { ROOT_DIR, type ExistsOptions } from '../../shared/mod.ts';

/**
 * Asserts that the provided path is an absolute path and normalizes it.
 *
 * @param path - The file path to validate.
 * @returns The normalized absolute path.
 * @throws Will throw an error if the path is not an absolute path.
 * @internal
 */
export function assertAbsolutePath(path: string): string {
    invariant(typeof path === 'string', () => `path must be a string but received ${ path }`);
    invariant(path[0] === ROOT_DIR, () => `path must start with / but received ${ path }`);

    const normalized = normalize(path);
    // Remove trailing slash except for root
    return normalized.length > 1 && normalized[normalized.length - 1] === ROOT_DIR
        ? normalized.slice(0, -1)
        : normalized;
}

/**
 * Asserts that the provided URL is valid and returns a URL object.
 * Supports relative URLs by using current location as base.
 *
 * @param url - The URL string or URL object to validate.
 * @returns The URL object.
 * @throws Will throw a TypeError if the URL is invalid.
 * @internal
 */
export function assertValidUrl(url: string | URL): URL {
    if (url instanceof URL) {
        return url;
    }

    try {
        return new URL(url, location.href);
    } catch {
        throw new TypeError(`Invalid URL: ${ url }`);
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