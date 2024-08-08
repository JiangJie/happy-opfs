import { join } from '@std/path/posix';
import { Ok, type AsyncIOResult } from 'happy-rusty';
import { TMP_DIR } from './constants.ts';
import type { TempOptions } from './defines.ts';
import { createFile, mkdir } from './opfs_core.ts';

/**
 * Generate a temporary path but not create it.
 *
 * @param options - Options and flags.
 * @returns The temporary path.
 */
export function generateTempPath(options?: TempOptions): string {
    const {
        isDirectory = false,
        basename = 'tmp',
        extname = '',
    } = options ?? {};

    // use uuid to generate a unique name
    return join(TMP_DIR, `${ basename }-${ crypto.randomUUID() }${ isDirectory ? '' : extname }`);
}

/**
 * Create a temporary file or directory.
 *
 * @param options - Options and flags.
 * @returns A promise that resolves the result of the temporary file or directory path.
 */
export async function mkTemp(options?: TempOptions): AsyncIOResult<string> {
    const {
        isDirectory = false,
    } = options ?? {};

    const path = generateTempPath(options);
    const res = await (isDirectory ? mkdir : createFile)(path);

    return res.and(Ok(path));
}