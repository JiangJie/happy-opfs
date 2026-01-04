import { fetchT } from '@happy-ts/fetch-t';
import { basename, join } from '@std/path/posix';
import * as fflate from 'fflate/browser';
import { Err, Ok, type AsyncIOResult, type AsyncVoidIOResult, type IOResult } from 'happy-rusty';
import { Future } from 'tiny-future';
import { assertAbsolutePath, assertFileUrl } from './assertions.ts';
import type { FsRequestInit, ZipOptions } from './defines.ts';
import { isFileHandle } from './guards.ts';
import { getFileDataByHandle } from './helpers.ts';
import { readDir, stat, writeFile } from './opfs_core.ts';
import { getUrlPathname } from './url.ts';

/**
 * Zip a zippable data then write to the target path.
 * @param zippable - Zippable data.
 * @param zipFilePath - Target zip file path.
 */
async function zipTo<T>(zippable: fflate.AsyncZippable, zipFilePath?: string): AsyncIOResult<T> {
    const future = new Future<IOResult<T>>();

    fflate.zip(zippable, {
        consume: true,
    }, async (err, u8a) => {
        if (err) {
            future.resolve(Err(err));
            return;
        }

        // whether to write to file
        if (zipFilePath) {
            const res = await writeFile(zipFilePath, u8a as Uint8Array<ArrayBuffer>);
            future.resolve(res as IOResult<T>);
        } else {
            future.resolve(Ok(u8a as T));
        }
    });

    return await future.promise;
}

/**
 * Zip a file or directory and write to a zip file.
 * Equivalent to `zip -r <zipFilePath> <targetPath>`.
 *
 * Use [fflate](https://github.com/101arrowz/fflate) as the zip backend.
 * @param sourcePath - The path to be zipped.
 * @param zipFilePath - The path to the zip file.
 * @param options - Options of zip.
 * @returns A promise that resolves to an `AsyncIOResult` indicating whether the source was successfully zipped.
 * @example
 * ```typescript
 * // Zip a directory to a file
 * (await zip('/documents', '/backups/documents.zip'))
 *     .inspect(() => console.log('Directory zipped successfully'));
 * ```
 */
export async function zip(sourcePath: string, zipFilePath: string, options?: ZipOptions): AsyncVoidIOResult;

/**
 * Zip a file or directory and return the zip file data.
 * Equivalent to `zip -r <zipFilePath> <targetPath>`.
 *
 * Use [fflate](https://github.com/101arrowz/fflate) as the zip backend.
 * @param sourcePath - The path to be zipped.
 * @param options - Options of zip.
 * @returns A promise that resolves to an `AsyncIOResult` indicating whether the source was successfully zipped.
 * @example
 * ```typescript
 * // Zip a directory and get the data
 * (await zip('/documents'))
 *     .inspect(zipData => console.log(`Zip size: ${zipData.byteLength} bytes`));
 * ```
 */
export async function zip(sourcePath: string, options?: ZipOptions): AsyncIOResult<Uint8Array>;
export async function zip<T>(sourcePath: string, zipFilePath?: string | ZipOptions, options?: ZipOptions): AsyncIOResult<T> {
    if (typeof zipFilePath === 'string') {
        assertAbsolutePath(zipFilePath);
    } else {
        options = zipFilePath;
        zipFilePath = undefined;
    }

    const statRes = await stat(sourcePath);

    return statRes.andThenAsync(async handle => {
        const sourceName = basename(sourcePath);
        const zippable: fflate.AsyncZippable = {};

        if (isFileHandle(handle)) {
            // file
            const dataRes = await getFileDataByHandle(handle);
            if (dataRes.isErr()) {
                return dataRes.asErr();
            }
            zippable[sourceName] = dataRes.unwrap();
        } else {
            // directory
            const readDirRes = await readDir(sourcePath, {
                recursive: true,
            });
            if (readDirRes.isErr()) {
                return readDirRes.asErr();
            }

            // default to preserve root
            const preserveRoot = options?.preserveRoot ?? true;
            const tasks: Promise<IOResult<{
                entryName: string;
                data: Uint8Array;
            }>>[] = [];

            for await (const { path, handle } of readDirRes.unwrap()) {
                if (!isFileHandle(handle)) {
                    continue;
                }

                const entryName = preserveRoot ? join(sourceName, path) : path;
                tasks.push(getFileDataByHandle(handle).then(res => res.map(data => ({
                    entryName,
                    data,
                }))));
            }

            if (tasks.length > 0) {
                const results = await Promise.all(tasks);
                for (const res of results) {
                    if (res.isErr()) {
                        return res.asErr();
                    }
                    const { entryName, data } = res.unwrap();
                    zippable[entryName] = data;
                }
            }
        }

        return zipTo(zippable, zipFilePath);
    });
}

/**
 * Zip a remote file and write to a zip file.
 *
 * Use [fflate](https://github.com/101arrowz/fflate) as the zip backend.
 * @param sourceUrl - The url to be zipped.
 * @param zipFilePath - The path to the zip file.
 * @param requestInit - Optional request initialization parameters.
 * @returns A promise that resolves to an `AsyncIOResult` indicating whether the source was successfully zipped.
 * @example
 * ```typescript
 * // Zip a remote file to a local zip file
 * (await zipFromUrl('https://example.com/file.txt', '/backups/file.zip'))
 *     .inspect(() => console.log('Remote file zipped successfully'));
 * ```
 */
export async function zipFromUrl(sourceUrl: string | URL, zipFilePath: string, requestInit?: FsRequestInit): AsyncVoidIOResult;

/**
 * Zip a remote file and return the zip file data.
 *
 * Use [fflate](https://github.com/101arrowz/fflate) as the zip backend.
 * @param sourceUrl - The url to be zipped.
 * @param requestInit - Optional request initialization parameters.
 * @returns A promise that resolves to an `AsyncIOResult` indicating whether the source was successfully zipped.
 * @example
 * ```typescript
 * // Zip a remote file and get the data
 * (await zipFromUrl('https://example.com/file.txt'))
 *     .inspect(zipData => console.log(`Zip size: ${zipData.byteLength} bytes`));
 * ```
 */
export async function zipFromUrl(sourceUrl: string | URL, requestInit?: FsRequestInit): AsyncIOResult<Uint8Array>;
export async function zipFromUrl<T>(sourceUrl: string | URL, zipFilePath?: string | FsRequestInit, requestInit?: FsRequestInit): AsyncIOResult<T> {
    assertFileUrl(sourceUrl);

    if (typeof zipFilePath === 'string') {
        assertAbsolutePath(zipFilePath);
    } else {
        requestInit = zipFilePath;
        zipFilePath = undefined;
    }

    const fetchRes = await fetchT(sourceUrl, {
        redirect: 'follow',
        ...requestInit,
        responseType: 'arraybuffer',
        abortable: false,
    });

    return fetchRes.andThenAsync(buffer => {
        const sourceName = basename(getUrlPathname(sourceUrl));
        const zippable: fflate.AsyncZippable = {};

        zippable[sourceName] = new Uint8Array(buffer);

        return zipTo(zippable, zipFilePath);
    });
}