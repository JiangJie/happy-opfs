import { join } from '@std/path/posix';
import { Err, Ok, RESULT_VOID, type AsyncIOResult, type AsyncVoidIOResult } from 'happy-rusty';
import { TMP_DIR } from './constants.ts';
import type { TempOptions } from './defines.ts';
import { createFile, mkdir, readDir, remove } from './opfs_core.ts';
import { isFileHandle } from './utils.ts';

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

    const base = basename ? `${ basename }-` : '';
    const ext = isDirectory ? '' : extname;

    // use uuid to generate a unique name
    return join(TMP_DIR, `${ base }${ crypto.randomUUID() }${ ext }`);
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

/**
 * Delete the temporary directory and all its contents.
 * @returns A promise that resolves to an `AsyncVoidIOResult` indicating whether the temporary directory was successfully deleted.
 */
export function deleteTemp(): AsyncVoidIOResult {
    return remove(TMP_DIR);
}

/**
 * Prune the temporary directory and delete all expired files.
 * @param expired - The date to determine whether a file is expired.
 * @returns A promise that resolves to an `AsyncVoidIOResult` indicating whether the temporary directory was successfully pruned.
 */
export async function pruneTemp(expired: Date): AsyncVoidIOResult {
    const res = await readDir(TMP_DIR, {
        recursive: true,
    });

    if (res.isErr()) {
        return res.asErr();
    }

    try {
        for await (const { handle } of res.unwrap()) {
            if (isFileHandle(handle) && (await handle.getFile()).lastModified <= expired.getTime()) {
                // TODO ts not support yet
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                await (handle as any).remove();
            }
        }
    } catch (e) {
        return Err(e as DOMException);
    }

    return RESULT_VOID;
}