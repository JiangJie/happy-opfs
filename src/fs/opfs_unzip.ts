import { fetchT } from '@happy-ts/fetch-t';
import { join, SEPARATOR } from '@std/path/posix';
import * as fflate from 'fflate/browser';
import { Err, RESULT_VOID, type AsyncVoidIOResult, type VoidIOResult } from 'happy-rusty';
import { Future } from 'tiny-future';
import { assertAbsolutePath, assertFileUrl } from './assertions.ts';
import type { FsRequestInit } from './defines.ts';
import { readFile, writeFile } from './opfs_core.ts';

/**
 * Unzip a buffer then write to the target path.
 * @param buffer - Zipped ArrayBuffer.
 * @param targetPath - Target directory path.
 */
async function unzipBufferToTarget(buffer: ArrayBuffer, targetPath: string): AsyncVoidIOResult {
    const data = new Uint8Array(buffer);

    const future = new Future<VoidIOResult>();

    fflate.unzip(data, async (err, unzipped) => {
        if (err) {
            future.resolve(Err(err));
            return;
        }

        const tasks: AsyncVoidIOResult[] = [];
        for (const path in unzipped) {
            // ignore directory
            if (path.at(-1) !== SEPARATOR) {
                tasks.push(writeFile(join(targetPath, path), unzipped[path]));
            }
        }

        const allRes = await Promise.all(tasks);
        // anyone failed?
        const fail = allRes.find(x => x.isErr());

        future.resolve(fail ?? RESULT_VOID);
    });

    return await future.promise;
}

/**
 * Unzip a zip file to a directory.
 * Equivalent to `unzip -o <zipFilePath> -d <targetPath>
 *
 * Use [fflate](https://github.com/101arrowz/fflate) as the unzip backend.
 * @param zipFilePath - Zip file path.
 * @param targetPath - The directory to unzip to.
 * @returns A promise that resolves to an `AsyncIOResult` indicating whether the zip file was successfully unzipped.
 */
export async function unzip(zipFilePath: string, targetPath: string): AsyncVoidIOResult {
    assertAbsolutePath(targetPath);

    const res = await readFile(zipFilePath);
    if (res.isErr()) {
        return res.asErr();
    }

    return await unzipBufferToTarget(res.unwrap(), targetPath);
}

/**
 * Unzip a remote zip file to a directory.
 * Equivalent to `unzip -o <zipFilePath> -d <targetPath>
 *
 * Use [fflate](https://github.com/101arrowz/fflate) as the unzip backend.
 * @param zipFileUrl - Zip file url.
 * @param targetPath - The directory to unzip to.
 * @param requestInit - Optional request initialization parameters.
 * @returns A promise that resolves to an `AsyncIOResult` indicating whether the zip file was successfully unzipped.
 */
export async function unzipFromUrl(zipFileUrl: string, targetPath: string, requestInit?: FsRequestInit): AsyncVoidIOResult {
    assertFileUrl(zipFileUrl);
    assertAbsolutePath(targetPath);

    const res = await fetchT(zipFileUrl, {
        redirect: 'follow',
        ...requestInit,
        responseType: 'arraybuffer',
    });
    if (res.isErr()) {
        return res.asErr();
    }

    return await unzipBufferToTarget(res.unwrap(), targetPath);
}