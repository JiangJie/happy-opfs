import invariant from 'tiny-invariant';
import { ROOT_DIR } from './constants.ts';
import { isValidUrl } from './url.ts';

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