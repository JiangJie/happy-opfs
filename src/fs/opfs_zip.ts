import { fetchT } from '@happy-ts/fetch-t';
import { basename, join } from '@std/path/posix';
import * as fflate from 'fflate/browser';
import { Err, Ok, tryAsyncResult, type AsyncIOResult, type AsyncVoidIOResult, type IOResult, type VoidIOResult } from 'happy-rusty';
import { Future } from 'tiny-future';
import { assertAbsolutePath, assertFileUrl } from './assertions.ts';
import type { FsRequestInit, ZipOptions } from './defines.ts';
import { isFileHandle } from './guards.ts';
import { createEmptyBodyError } from './helpers.ts';
import { readDir, stat, writeFile } from './opfs_core.ts';
import { getUrlPathname } from './url.ts';

type ZipIOResult = IOResult<Uint8Array> | VoidIOResult;

/**
 * Zip a zippable data then write to the target path.
 * @param zippable - Zippable data.
 * @param zipFilePath - Target zip file path.
 */
function zipTo(zippable: fflate.AsyncZippable, zipFilePath?: string): Promise<ZipIOResult> {
    const future = new Future<ZipIOResult>();

    fflate.zip(zippable, {
        consume: true,
    }, async (err, u8a) => {
        if (err) {
            future.resolve(Err(err) as ZipIOResult);
            return;
        }

        // whether to write to file
        if (zipFilePath) {
            future.resolve(writeFile(zipFilePath, u8a as Uint8Array<ArrayBuffer>));
        } else {
            future.resolve(Ok(u8a));
        }
    });

    return future.promise;
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
export function zip(sourcePath: string, zipFilePath: string, options?: ZipOptions): AsyncVoidIOResult;

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
export function zip(sourcePath: string, options?: ZipOptions): AsyncIOResult<Uint8Array>;
export async function zip(sourcePath: string, zipFilePath?: string | ZipOptions, options?: ZipOptions): Promise<ZipIOResult> {
    if (typeof zipFilePath === 'string') {
        zipFilePath = assertAbsolutePath(zipFilePath);
    } else {
        options = zipFilePath;
        zipFilePath = undefined;
    }

    const statRes = await stat(sourcePath);
    if (statRes.isErr()) {
        return statRes.asErr() as ZipIOResult;
    }

    const handle = statRes.unwrap();
    const sourceName = basename(sourcePath);
    const zippable: fflate.AsyncZippable = {};

    if (isFileHandle(handle)) {
        // file
        const dataRes = await getFileDataByHandle(handle);
        if (dataRes.isErr()) {
            return dataRes.asErr() as ZipIOResult;
        }
        zippable[sourceName] = dataRes.unwrap();
    } else {
        // directory
        const readDirRes = await readDir(sourcePath, {
            recursive: true,
        });
        if (readDirRes.isErr()) {
            return readDirRes.asErr() as ZipIOResult;
        }

        // default to preserve root
        const { preserveRoot = true } = options ?? {};
        const tasks: AsyncIOResult<{
            entryName: string;
            data: Uint8Array;
        }>[] = [];

        for await (const { path, handle } of readDirRes.unwrap()) {
            if (!isFileHandle(handle)) {
                continue;
            }

            const entryName = preserveRoot ? join(sourceName, path) : path;
            tasks.push((async () => {
                const dataRes = await getFileDataByHandle(handle);
                return dataRes.map(data => ({
                    entryName,
                    data,
                }));
            })());
        }

        if (tasks.length > 0) {
            const results = await Promise.all(tasks);
            for (const res of results) {
                if (res.isErr()) {
                    return res.asErr() as ZipIOResult;
                }
                const { entryName, data } = res.unwrap();
                zippable[entryName] = data;
            }
        }
    }

    return zipTo(zippable, zipFilePath);
}

/**
 * Zip a remote file and write to a zip file.
 *
 * Use [fflate](https://github.com/101arrowz/fflate) as the zip backend.
 *
 * This API is built on `@happy-ts/fetch-t` for downloading the source.
 * `requestInit` supports `timeout` and `onProgress` via {@link FsRequestInit}.
 *
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
export function zipFromUrl(sourceUrl: string | URL, zipFilePath: string, requestInit?: FsRequestInit): AsyncVoidIOResult;

/**
 * Zip a remote file and return the zip file data.
 *
 * Use [fflate](https://github.com/101arrowz/fflate) as the zip backend.
 *
 * This API is built on `@happy-ts/fetch-t` for downloading the source.
 * `requestInit` supports `timeout` and `onProgress` via {@link FsRequestInit}.
 *
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
export function zipFromUrl(sourceUrl: string | URL, requestInit?: FsRequestInit): AsyncIOResult<Uint8Array>;
export async function zipFromUrl(sourceUrl: string | URL, zipFilePath?: string | FsRequestInit, requestInit?: FsRequestInit): Promise<ZipIOResult> {
    assertFileUrl(sourceUrl);

    if (typeof zipFilePath === 'string') {
        zipFilePath = assertAbsolutePath(zipFilePath);
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

    if (fetchRes.isErr()) {
        return fetchRes.asErr() as ZipIOResult;
    }

    const buffer = fetchRes.unwrap();

    // body can be null for 204/304 responses or HEAD requests
    if (buffer.byteLength === 0) {
        return Err(createEmptyBodyError()) as ZipIOResult;
    }

    const sourceName = basename(getUrlPathname(sourceUrl));
    const zippable: fflate.AsyncZippable = {
        [sourceName]: new Uint8Array(buffer),
    };

    return zipTo(zippable, zipFilePath);
}

/**
 * Reads the binary data from a file handle.
 *
 * @param fileHandle - The `FileSystemFileHandle` to read from.
 * @returns A promise that resolves to an `AsyncIOResult` containing the file content as a `Uint8Array`.
 */
function getFileDataByHandle(fileHandle: FileSystemFileHandle): AsyncIOResult<Uint8Array<ArrayBuffer>> {
    return tryAsyncResult(async () => {
        const file = await fileHandle.getFile();
        const ab = await file.arrayBuffer();
        return new Uint8Array(ab);
    });
}