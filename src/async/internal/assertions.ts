import { normalize } from '@std/path/posix';
import invariant from 'tiny-invariant';
import { ROOT_DIR, type ExistsOptions } from '../../shared/mod.ts';
import { isValidUrl } from './url.ts';

/**
 * Asserts that the provided path is an absolute path and normalizes it.
 *
 * @param path - The file path to validate.
 * @returns The normalized absolute path.
 * @throws Will throw an error if the path is not an absolute path.
 * @internal
 */
export function assertAbsolutePath(path: string): string {
    invariant(typeof path === 'string', () => `Path must be a string but received ${ path }`);
    invariant(path[0] === ROOT_DIR, () => `Path must start with / but received ${ path }`);

    const normalized = normalize(path);
    // Remove trailing slash except for root
    return normalized.length > 1 && normalized[normalized.length - 1] === ROOT_DIR
        ? normalized.slice(0, -1)
        : normalized;
}

/**
 * Asserts that the provided URL is a valid file URL.
 *
 * @param fileUrl - The file URL to validate.
 * @throws Will throw an error if the URL is not a valid file URL.
 * @internal
 */
export function assertFileUrl(fileUrl: string | URL): void {
    if (fileUrl instanceof URL) {
        return;
    }
    invariant(typeof fileUrl === 'string', () => `File url must be a string or URL but received ${ fileUrl }`);
    invariant(isValidUrl(fileUrl), () => `File url must be a valid URL but received ${ fileUrl }`);
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
    invariant(!(isDirectory && isFile), () => 'ExistsOptions.isDirectory and ExistsOptions.isFile must not be true together');
}

/**
 * Asserts that the provided value is a valid Date for pruneTemp expiration.
 *
 * @param expired - The value to validate.
 * @throws Will throw an error if the value is not a Date instance.
 * @internal
 */
export function assertExpiredDate(expired: unknown): asserts expired is Date {
    invariant(expired instanceof Date, () => `Expired must be a Date but received ${ expired }`);
}