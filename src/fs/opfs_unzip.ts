import { fetchT } from '@happy-ts/fetch-t';
import { join, SEPARATOR } from '@std/path/posix';
import * as fflate from 'fflate/browser';
import { Err, type AsyncVoidIOResult, type VoidIOResult } from 'happy-rusty';
import { Future } from 'tiny-future';
import { assertAbsolutePath, assertFileUrl } from './assertions.ts';
import { readFile, writeFile } from './core/mod.ts';
import type { FsRequestInit } from './defines.ts';
import { aggregateResults, createEmptyBodyError } from './helpers.ts';

/**
 * Unzip a buffer then write to the target path.
 * @param buffer - Zipped Uint8Array.
 * @param targetPath - Target directory path.
 */
function unzipBufferToTarget(buffer: Uint8Array, targetPath: string): AsyncVoidIOResult {
    const future = new Future<VoidIOResult>();

    fflate.unzip(buffer, async (err, unzipped) => {
        if (err) {
            future.resolve(Err(err));
            return;
        }

        const tasks: AsyncVoidIOResult[] = [];

        for (const path in unzipped) {
            // ignore directory
            if (path.at(-1) !== SEPARATOR) {
                tasks.push(writeFile(join(targetPath, path), unzipped[path] as Uint8Array<ArrayBuffer>));
            }
        }

        future.resolve(aggregateResults(tasks));
    });

    return future.promise;
}

/**
 * Unzip a zip file to a directory.
 * Equivalent to `unzip -o <zipFilePath> -d <targetPath>
 *
 * Use [fflate](https://github.com/101arrowz/fflate) as the unzip backend.
 * @param zipFilePath - Zip file path.
 * @param targetPath - The directory to unzip to.
 * @returns A promise that resolves to an `AsyncIOResult` indicating whether the zip file was successfully unzipped.
 * @example
 * ```typescript
 * (await unzip('/downloads/archive.zip', '/extracted'))
 *     .inspect(() => console.log('Unzipped successfully'));
 * ```
 */
export async function unzip(zipFilePath: string, targetPath: string): AsyncVoidIOResult {
    targetPath = assertAbsolutePath(targetPath);

    const fileRes = await readFile(zipFilePath, {
        encoding: 'bytes',
    });

    return fileRes.andThenAsync(buffer => {
        return unzipBufferToTarget(buffer, targetPath);
    });
}

/**
 * Unzip a remote zip file to a directory.
 * Equivalent to `unzip -o <zipFilePath> -d <targetPath>
 *
 * Use [fflate](https://github.com/101arrowz/fflate) as the unzip backend.
 *
 * This API is built on `@happy-ts/fetch-t` for downloading the zip file.
 * `requestInit` supports `timeout` and `onProgress` via {@link FsRequestInit}.
 *
 * @param zipFileUrl - Zip file url.
 * @param targetPath - The directory to unzip to.
 * @param requestInit - Optional request initialization parameters.
 * @returns A promise that resolves to an `AsyncIOResult` indicating whether the zip file was successfully unzipped.
 * @example
 * ```typescript
 * (await unzipFromUrl('https://example.com/archive.zip', '/extracted'))
 *     .inspect(() => console.log('Remote zip file unzipped successfully'));
 * ```
 */
export async function unzipFromUrl(zipFileUrl: string | URL, targetPath: string, requestInit?: FsRequestInit): AsyncVoidIOResult {
    assertFileUrl(zipFileUrl);
    targetPath = assertAbsolutePath(targetPath);

    const fetchRes = await fetchT(zipFileUrl, {
        redirect: 'follow',
        ...requestInit,
        responseType: 'bytes',
        abortable: false,
    });

    return fetchRes.andThenAsync(buffer => {
        // body can be null for 204/304 responses or HEAD requests
        if (buffer.byteLength === 0) {
            return Err(createEmptyBodyError());
        }

        return unzipBufferToTarget(buffer, targetPath);
    });
}