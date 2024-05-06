import { ROOT_DIR } from './constants.ts';

/**
 * assert function
 * @param expr
 * @param createMsg return a string message to throw
 */
function invariant(expr: unknown, createMsg: () => string): void {
    if (!expr) {
        throw new TypeError(createMsg());
    }
}

/**
 * assert path starts with /
 * @param path
 */
export function assertAbsolutePath(path: string): void {
    invariant(typeof path === 'string', () => `Path must be a string. Received ${ JSON.stringify(path) }`);
    invariant(path[0] === ROOT_DIR, () => `Path must start with /. Received ${ JSON.stringify(path) }`);
}

/**
 * assert url is a string
 *
 * @param fileUrl
 */
export function assertFileUrl(fileUrl: string): void {
    invariant(typeof fileUrl === 'string', () => `File url must be a string. Received ${ JSON.stringify(fileUrl) }`);
}