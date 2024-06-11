import invariant from 'tiny-invariant';
import { ROOT_DIR } from './constants.ts';

/**
 * assert path starts with /
 * @param path
 */
export function assertAbsolutePath(path: string): void {
    invariant(typeof path === 'string', () => `Path must be a string but received ${ path }`);
    invariant(path[0] === ROOT_DIR, () => `Path must start with / but received ${ path }`);
}

/**
 * assert url is a string
 *
 * @param fileUrl
 */
export function assertFileUrl(fileUrl: string): void {
    invariant(typeof fileUrl === 'string', () => `File url must be a string but received ${ fileUrl }`);
}