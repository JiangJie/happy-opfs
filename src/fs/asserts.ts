import { ROOT_DIR } from './constants.ts';

/**
 * assert path is string
 *
 * forked from deno std/path
 * @param path
 */
export function assertPath(path: string): void {
    if (typeof path !== 'string') {
        throw new TypeError(`Path must be a string. Received ${ JSON.stringify(path) }`);
    }
}

/**
 * assert path starts with /
 * @param path
 */
export function assertAbsolutePath(path: string): void {
    assertPath(path);

    if (path[0] !== ROOT_DIR) {
        throw new TypeError(`Path must start with /. Received ${ JSON.stringify(path) }`);
    }
}