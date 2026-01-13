import { fetchT } from '@happy-ts/fetch-t';
import { basename, join } from '@std/path/posix';
import { zip as compress, type AsyncZippable } from 'fflate/browser';
import { Err, Ok, tryAsyncResult, type AsyncIOResult, type AsyncVoidIOResult, type IOResult, type VoidIOResult } from 'happy-rusty';
import { Future } from 'tiny-future';
import { readBlobBytes, readBlobBytesSync } from '../../shared/helpers.ts';
import { isFileHandle, type ZipFromUrlRequestInit, type ZipOptions } from '../../shared/mod.ts';
import { readDir, stat, writeFile } from '../core/mod.ts';
import { createEmptyBodyError, validateAbsolutePath, validateUrl } from '../internal/mod.ts';

/**
 * Result type for zip operation.
 */
type ZipIOResult = IOResult<Uint8Array<ArrayBuffer>> | VoidIOResult;

/**
 * Empty bytes for directory entries in zip.
 */
const EMPTY_DIR_DATA = new Uint8Array(0);

/**
 * Zip a file or directory and write to a zip file.
 * Equivalent to `zip -r <zipFilePath> <sourcePath>`.
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
 * Equivalent to `zip -r <zipFilePath> <sourcePath>`.
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
export function zip(sourcePath: string, options?: ZipOptions): AsyncIOResult<Uint8Array<ArrayBuffer>>;
export async function zip(sourcePath: string, zipFilePath?: string | ZipOptions, options?: ZipOptions): Promise<ZipIOResult> {
    if (typeof zipFilePath === 'string') {
        const zipFilePathRes = validateAbsolutePath(zipFilePath);
        if (zipFilePathRes.isErr()) return zipFilePathRes.asErr() as ZipIOResult;
        zipFilePath = zipFilePathRes.unwrap();
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
    const zippable: AsyncZippable = {};

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
            data: Uint8Array<ArrayBuffer>;
        }>[] = [];

        // Add root directory entry
        if (preserveRoot) {
            zippable[`${ sourceName }/`] = EMPTY_DIR_DATA;
        }

        try {
            for await (const { path, handle } of readDirRes.unwrap()) {
                const entryName = preserveRoot ? join(sourceName, path) : path;

                if (isFileHandle(handle)) {
                    // file
                    tasks.push((async () => {
                        const dataRes = await getFileDataByHandle(handle);
                        return dataRes.map(data => ({
                            entryName,
                            data,
                        }));
                    })());
                } else {
                    // directory - add entry with trailing slash and empty content
                    zippable[`${ entryName }/`] = EMPTY_DIR_DATA;
                }
            }
        } catch (e) {
            return Err(e as Error) as ZipIOResult;
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

    // Nothing to zip - matches standard zip command behavior
    if (Object.keys(zippable).length === 0) {
        return Err(new Error('Nothing to zip')) as ZipIOResult;
    }

    return zipTo(zippable, zipFilePath);
}

/**
 * Zip a remote file and write to a zip file.
 *
 * Use [fflate](https://github.com/101arrowz/fflate) as the zip backend.
 *
 * This API is built on `@happy-ts/fetch-t` for downloading the source.
 * `requestInit` supports `timeout`, `onProgress`, and `filename` via {@link ZipFromUrlRequestInit}.
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
export function zipFromUrl(sourceUrl: string | URL, zipFilePath: string, requestInit?: ZipFromUrlRequestInit): AsyncVoidIOResult;

/**
 * Zip a remote file and return the zip file data.
 *
 * Use [fflate](https://github.com/101arrowz/fflate) as the zip backend.
 *
 * This API is built on `@happy-ts/fetch-t` for downloading the source.
 * `requestInit` supports `timeout`, `onProgress`, and `filename` via {@link ZipFromUrlRequestInit}.
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
export function zipFromUrl(sourceUrl: string | URL, requestInit?: ZipFromUrlRequestInit): AsyncIOResult<Uint8Array<ArrayBuffer>>;
export async function zipFromUrl(sourceUrl: string | URL, zipFilePath?: string | ZipFromUrlRequestInit, requestInit?: ZipFromUrlRequestInit): Promise<ZipIOResult> {
    const sourceUrlRes = validateUrl(sourceUrl);
    if (sourceUrlRes.isErr()) return sourceUrlRes.asErr() as ZipIOResult;
    sourceUrl = sourceUrlRes.unwrap();

    if (typeof zipFilePath === 'string') {
        const zipFilePathRes = validateAbsolutePath(zipFilePath);
        if (zipFilePathRes.isErr()) return zipFilePathRes.asErr() as ZipIOResult;
        zipFilePath = zipFilePathRes.unwrap();
    } else {
        requestInit = zipFilePath;
        zipFilePath = undefined;
    }

    const fetchRes = await fetchT(sourceUrl, {
        redirect: 'follow',
        ...requestInit,
        responseType: 'bytes',
        abortable: false,
    });

    if (fetchRes.isErr()) {
        return fetchRes.asErr() as ZipIOResult;
    }

    const bytes = fetchRes.unwrap();

    // body can be null for 204/304 responses or HEAD requests
    if (bytes.byteLength === 0) {
        return Err(createEmptyBodyError()) as ZipIOResult;
    }

    const { filename } = requestInit ?? {};
    // Use provided filename, or basename of pathname, or 'file' as fallback
    const sourceName = filename ?? (sourceUrl.pathname !== '/' ? basename(sourceUrl.pathname) : 'file');

    return zipTo({
        [sourceName]: bytes,
    }, zipFilePath);
}

// ============================================================================
// Internal Functions
// ============================================================================

/**
 * Zip a zippable data then write to the target path.
 * @param zippable - Zippable data.
 * @param zipFilePath - Target zip file path.
 */
function zipTo(zippable: AsyncZippable, zipFilePath?: string): Promise<ZipIOResult> {
    const future = new Future<ZipIOResult>();

    compress(zippable, {
        consume: true,
    }, async (err, bytesLike) => {
        if (err) {
            future.resolve(Err(err) as ZipIOResult);
            return;
        }

        const bytes = bytesLike as Uint8Array<ArrayBuffer>;
        // whether to write to file
        if (zipFilePath) {
            future.resolve(writeFile(zipFilePath, bytes));
        } else {
            future.resolve(Ok(bytes));
        }
    });

    return future.promise;
}

/**
 * Reads the binary data from a file handle.
 * Uses FileReaderSync in Worker context for better performance,
 * falls back to async readBlobBytes in main thread.
 *
 * @param fileHandle - The `FileSystemFileHandle` to read from.
 * @returns A promise that resolves to an `AsyncIOResult` containing the file content as a `Uint8Array`.
 */
function getFileDataByHandle(fileHandle: FileSystemFileHandle): AsyncIOResult<Uint8Array<ArrayBuffer>> {
    return tryAsyncResult(async () => {
        const file = await fileHandle.getFile();
        // Use sync read in Worker context, async in main thread
        return typeof FileReaderSync === 'function'
            ? readBlobBytesSync(file)
            : readBlobBytes(file);
    });
}
