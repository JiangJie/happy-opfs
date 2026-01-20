import { fetchT } from '@happy-ts/fetch-t';
import { join, SEPARATOR } from '@std/path/posix';
import { unzip as decompress } from 'fflate/browser';
import { Err, type AsyncIOResult, type AsyncVoidIOResult, type VoidIOResult } from 'happy-rusty';
import { Future } from 'tiny-future';
import { validateUrl } from '../../shared/internal/mod.ts';
import type { UnzipFromUrlRequestInit } from '../../shared/mod.ts';
import { mkdir, readFile, writeFile } from '../core/mod.ts';
import { aggregateResults, createEmptyBodyError, createEmptyFileError, markParentDirsNonEmpty } from '../internal/mod.ts';
import { validateDestDir } from './helpers.ts';

/**
 * Unzip a zip file to a directory using batch decompression.
 * Equivalent to `unzip -o <zipFilePath> -d <destDir>`
 *
 * This function loads the entire zip file into memory before decompression.
 * Faster for small files (<5MB). For large files, consider using {@link unzipStream} instead.
 *
 * Use [fflate](https://github.com/101arrowz/fflate) as the unzip backend.
 *
 * @param zipFilePath - Zip file path.
 * @param destDir - The directory to unzip to.
 * @returns A promise that resolves to an `AsyncIOResult` indicating whether the zip file was successfully unzipped.
 * @since 1.6.0
 * @see {@link unzipSync} for synchronous version
 * @see {@link unzipStream} for streaming version (better for large files)
 * @see {@link zip} for the reverse operation
 * @example
 * ```typescript
 * (await unzip('/downloads/archive.zip', '/extracted'))
 *     .inspect(() => console.log('Unzipped successfully'));
 * ```
 */
export async function unzip(zipFilePath: string, destDir: string): AsyncVoidIOResult {
    return unzipWith(
        () => readFile(zipFilePath),
        destDir,
        createEmptyFileError,
    );
}

/**
 * Unzip a remote zip file to a directory using batch decompression.
 * Equivalent to `unzip -o <zipFilePath> -d <destDir>`
 *
 * This function loads the entire zip file into memory before decompression.
 * Faster for small files (<5MB). For large files, consider using {@link unzipStreamFromUrl} instead.
 *
 * Use [fflate](https://github.com/101arrowz/fflate) as the unzip backend.
 *
 * This API is built on `@happy-ts/fetch-t` for downloading the zip file.
 * `options` supports `timeout` and `onProgress` options.
 *
 * @param zipFileUrl - Zip file url.
 * @param destDir - The directory to unzip to.
 * @param requestInit - Optional request options.
 * @returns A promise that resolves to an `AsyncIOResult` indicating whether the zip file was successfully unzipped.
 * @since 1.7.0
 * @see {@link unzipStreamFromUrl} for streaming version (better for large files)
 * @see {@link zipFromUrl} for the reverse operation
 * @example
 * ```typescript
 * (await unzipFromUrl('https://example.com/archive.zip', '/extracted'))
 *     .inspect(() => console.log('Remote zip file unzipped successfully'));
 *
 * // With timeout
 * (await unzipFromUrl('https://example.com/archive.zip', '/extracted', { timeout: 5000 }))
 *     .inspect(() => console.log('Remote zip file unzipped successfully'));
 * ```
 */
export async function unzipFromUrl(zipFileUrl: string | URL, destDir: string, requestInit?: UnzipFromUrlRequestInit): AsyncVoidIOResult {
    const zipFileUrlRes = validateUrl(zipFileUrl);
    if (zipFileUrlRes.isErr()) return zipFileUrlRes.asErr();
    zipFileUrl = zipFileUrlRes.unwrap();

    return unzipWith(
        () => fetchT(zipFileUrl, {
            redirect: 'follow',
            ...requestInit,
            responseType: 'bytes',
            abortable: false,
        }),
        destDir,
        createEmptyBodyError,
    );
}

// #region Internal Functions

/**
 * Common unzip implementation for both local and remote sources.
 * @param getBytes - Function to get zip data.
 * @param destDir - Destination directory path.
 * @param createEmptyError - Function to create error for empty data.
 */
async function unzipWith(
    getBytes: () => AsyncIOResult<Uint8Array<ArrayBuffer>>,
    destDir: string,
    createEmptyError: () => Error,
): AsyncVoidIOResult {
    const destDirRes = await validateDestDir(destDir);
    if (destDirRes.isErr()) return destDirRes.asErr();
    destDir = destDirRes.unwrap();

    const bytesRes = await getBytes();

    return bytesRes.andThenAsync(bytes => {
        return bytes.byteLength === 0
            ? Err(createEmptyError())
            : batchUnzipTo(bytes, destDir);
    });
}

/**
 * Unzip a buffer then write to the destination directory.
 * @param bytes - Zipped Uint8Array.
 * @param destDir - Destination directory path.
 */
function batchUnzipTo(bytes: Uint8Array<ArrayBuffer>, destDir: string): AsyncVoidIOResult {
    const future = new Future<VoidIOResult>();

    decompress(bytes, async (err, unzipped) => {
        if (err) {
            future.resolve(Err(err));
            return;
        }

        // Collect all tasks for parallel execution
        const tasks: AsyncVoidIOResult[] = [];
        const dirs: string[] = [];
        const nonEmptyDirs = new Set<string>();

        for (const path in unzipped) {
            if (path.at(-1) === SEPARATOR) {
                // Collect directory entries without trailing slash
                dirs.push(path.slice(0, -1));
            } else {
                // File entry - writeFile will create parent directories automatically
                tasks.push(writeFile(join(destDir, path), unzipped[path] as Uint8Array<ArrayBuffer>));
                // Mark all parent directories as non-empty
                markParentDirsNonEmpty(path, nonEmptyDirs);
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

// #endregion
