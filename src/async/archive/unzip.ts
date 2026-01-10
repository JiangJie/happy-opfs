import { fetchT } from '@happy-ts/fetch-t';
import { join, SEPARATOR } from '@std/path/posix';
import * as fflate from 'fflate/browser';
import { Err, type AsyncVoidIOResult, type VoidIOResult } from 'happy-rusty';
import { Future } from 'tiny-future';
import type { FsRequestInit } from '../../shared/mod.ts';
import { mkdir, readFile, writeFile } from '../core/mod.ts';
import { aggregateResults, assertAbsolutePath, assertFileUrl, createEmptyBodyError } from '../internal/mod.ts';

/**
 * Unzip a buffer then write to the destination directory.
 * @param bytes - Zipped Uint8Array.
 * @param destDir - Destination directory path.
 */
function unzipTo(bytes: Uint8Array<ArrayBuffer>, destDir: string): AsyncVoidIOResult {
    const future = new Future<VoidIOResult>();

    fflate.unzip(bytes, async (err, unzipped) => {
        if (err) {
            future.resolve(Err(err));
            return;
        }

        const tasks: AsyncVoidIOResult[] = [];
        const dirs: string[] = [];
        const nonEmptyDirs = new Set<string>();

        for (const path in unzipped) {
            if (path.at(-1) === SEPARATOR) {
                // Collect directory entries, process later
                dirs.push(path);
            } else {
                // File entry - writeFile will create parent directories automatically
                tasks.push(writeFile(join(destDir, path), unzipped[path] as Uint8Array<ArrayBuffer>));

                // Mark all parent directories as non-empty
                let slashIndex = path.lastIndexOf(SEPARATOR);
                while (slashIndex > 0) {
                    const parent = path.slice(0, slashIndex + 1);
                    if (nonEmptyDirs.has(parent)) break;
                    nonEmptyDirs.add(parent);
                    slashIndex = path.lastIndexOf(SEPARATOR, slashIndex - 1);
                }
            }
        }

        // Only create truly empty directories
        for (const dir of dirs) {
            if (!nonEmptyDirs.has(dir)) {
                tasks.push(mkdir(join(destDir, dir)));
            }
        }

        future.resolve(aggregateResults(tasks));
    });

    return future.promise;
}

/**
 * Unzip a zip file to a directory.
 * Equivalent to `unzip -o <zipFilePath> -d <destDir>
 *
 * Use [fflate](https://github.com/101arrowz/fflate) as the unzip backend.
 * @param zipFilePath - Zip file path.
 * @param destDir - The directory to unzip to.
 * @returns A promise that resolves to an `AsyncIOResult` indicating whether the zip file was successfully unzipped.
 * @example
 * ```typescript
 * (await unzip('/downloads/archive.zip', '/extracted'))
 *     .inspect(() => console.log('Unzipped successfully'));
 * ```
 */
export async function unzip(zipFilePath: string, destDir: string): AsyncVoidIOResult {
    destDir = assertAbsolutePath(destDir);

    const fileRes = await readFile(zipFilePath);

    return fileRes.andThenAsync(bytes => {
        return unzipTo(bytes, destDir);
    });
}

/**
 * Unzip a remote zip file to a directory.
 * Equivalent to `unzip -o <zipFilePath> -d <destDir>
 *
 * Use [fflate](https://github.com/101arrowz/fflate) as the unzip backend.
 *
 * This API is built on `@happy-ts/fetch-t` for downloading the zip file.
 * `requestInit` supports `timeout` and `onProgress` via {@link FsRequestInit}.
 *
 * @param zipFileUrl - Zip file url.
 * @param destDir - The directory to unzip to.
 * @param requestInit - Optional request initialization parameters.
 * @returns A promise that resolves to an `AsyncIOResult` indicating whether the zip file was successfully unzipped.
 * @example
 * ```typescript
 * (await unzipFromUrl('https://example.com/archive.zip', '/extracted'))
 *     .inspect(() => console.log('Remote zip file unzipped successfully'));
 * ```
 */
export async function unzipFromUrl(zipFileUrl: string | URL, destDir: string, requestInit?: FsRequestInit): AsyncVoidIOResult {
    assertFileUrl(zipFileUrl);
    destDir = assertAbsolutePath(destDir);

    const fetchRes = await fetchT(zipFileUrl, {
        redirect: 'follow',
        ...requestInit,
        responseType: 'bytes',
        abortable: false,
    });

    return fetchRes.andThenAsync(bytes => {
        // body can be null for 204/304 responses or HEAD requests
        if (bytes.byteLength === 0) {
            return Err(createEmptyBodyError());
        }

        return unzipTo(bytes, destDir);
    });
}