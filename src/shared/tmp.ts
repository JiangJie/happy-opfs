import { join, SEPARATOR } from '@std/path/posix';
import { TMP_DIR } from './constants.ts';
import type { TempOptions } from './defines.ts';

/**
 * Generates a unique temporary file or directory path without creating it.
 * Uses `crypto.randomUUID()` to ensure uniqueness.
 *
 * @param options - Options for generating the temporary path.
 * @returns The generated temporary path string.
 * @since 1.7.0
 * @see {@link mkTemp} for creating the temporary file/directory
 * @see {@link isTempPath} for checking if a path is temporary
 * @example
 * ```typescript
 * generateTempPath();                           // '/tmp/tmp-550e8400-e29b-41d4-a716-446655440000'
 * generateTempPath({ basename: 'cache' });      // '/tmp/cache-550e8400-e29b-41d4-a716-446655440000'
 * generateTempPath({ extname: '.txt' });        // '/tmp/tmp-550e8400-e29b-41d4-a716-446655440000.txt'
 * generateTempPath({ isDirectory: true });      // '/tmp/tmp-550e8400-e29b-41d4-a716-446655440000'
 * ```
 */
export function generateTempPath(options?: TempOptions): string {
    const {
        isDirectory = false,
        basename = 'tmp',
        extname = '',
    } = options ?? {};

    const base = basename ? `${ basename }-` : '';
    const ext = isDirectory ? '' : extname;

    // use uuid to generate a unique name
    return join(TMP_DIR, base + crypto.randomUUID() + ext);
}

/**
 * Checks whether the path is a temporary path (under `/tmp`).
 *
 * @param path - The path to check.
 * @returns `true` if the path starts with `/tmp/`, otherwise `false`.
 * @since 1.7.2
 * @see {@link generateTempPath} for generating temporary paths
 * @see {@link TMP_DIR} for the temporary directory constant
 * @example
 * ```typescript
 * isTempPath('/tmp/file.txt');  // true
 * isTempPath('/data/file.txt'); // false
 * ```
 */
export function isTempPath(path: string): boolean {
    return path.startsWith(TMP_DIR + SEPARATOR);
}
