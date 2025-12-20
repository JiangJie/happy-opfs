import invariant from 'tiny-invariant';
import { ROOT_DIR } from './constants.ts';

/**
 * Asserts that the provided path is an absolute path.
 *
 * @param path - The file path to validate.
 * @throws Will throw an error if the path is not an absolute path.
 */
export function assertAbsolutePath(path: string): void {
    invariant(typeof path === 'string', () => `Path must be a string but received ${ path }`);
    invariant(path[0] === ROOT_DIR, () => `Path must start with / but received ${ path }`);
}

/**
 * Checks if a string is a valid URL.
 *
 * @param url - The URL string to validate.
 * @returns Whether the URL is valid.
 */
function isValidUrl(url: string): boolean {
    if (typeof URL.canParse === 'function') {
        return URL.canParse(url);
    }
    // Fallback for older browsers
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}

/**
 * Asserts that the provided URL is a valid file URL.
 *
 * @param fileUrl - The file URL to validate.
 * @throws Will throw an error if the URL is not a valid file URL.
 */
export function assertFileUrl(fileUrl: string | URL): void {
    if (fileUrl instanceof URL) {
        return;
    }
    invariant(typeof fileUrl === 'string', () => `File url must be a string or URL but received ${ fileUrl }`);
    invariant(isValidUrl(fileUrl), () => `File url must be a valid URL but received ${ fileUrl }`);
}