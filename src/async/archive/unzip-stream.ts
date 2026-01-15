import { fetchT } from '@happy-ts/fetch-t';
import { join, SEPARATOR } from '@std/path/posix';
import { AsyncUnzipInflate, Unzip, UnzipPassThrough, type UnzipFile } from 'fflate/browser';
import { Err, type AsyncIOResult, type AsyncVoidIOResult } from 'happy-rusty';
import type { UnzipFromUrlRequestInit } from '../../shared/mod.ts';
import { mkdir, readFile, writeFile } from '../core/mod.ts';
import { aggregateResults, createEmptyBodyError, createEmptyFileError, markParentDirsNonEmpty, validateUrl } from '../internal/mod.ts';
import { EMPTY_BYTES, validateDestDir } from './helpers.ts';

/**
 * Unzip a zip file to a directory using streaming decompression.
 * Equivalent to `unzip -o <zipFilePath> -d <destDir>`
 *
 * This function processes the zip file incrementally, minimizing memory usage.
 * Recommended for large files (>10MB). For small files, consider using {@link unzip} instead.
 *
 * Use [fflate](https://github.com/101arrowz/fflate) as the unzip backend.
 *
 * @param zipFilePath - Zip file path.
 * @param destDir - The directory to unzip to.
 * @returns A promise that resolves to an `AsyncIOResult` indicating whether the zip file was successfully unzipped.
 * @since unreleased
 * @see {@link unzip} for batch version (faster for small files)
 * @see {@link zipStream} for the reverse operation
 * @example
 * ```typescript
 * (await unzipStream('/downloads/large-archive.zip', '/extracted'))
 *     .inspect(() => console.log('Unzipped successfully'));
 * ```
 */
export async function unzipStream(zipFilePath: string, destDir: string): AsyncVoidIOResult {
    return unzipStreamWith(
        () => readFile(zipFilePath, { encoding: 'stream' }),
        destDir,
        createEmptyFileError,
    );
}

/**
 * Unzip a remote zip file to a directory using streaming decompression.
 * Equivalent to `unzip -o <zipFilePath> -d <destDir>`
 *
 * This function processes the zip file incrementally, minimizing memory usage.
 * Recommended for large files (>10MB). For small files, consider using {@link unzipFromUrl} instead.
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
 * @since unreleased
 * @see {@link unzipFromUrl} for batch version (faster for small files)
 * @see {@link zipStreamFromUrl} for the reverse operation
 * @example
 * ```typescript
 * (await unzipStreamFromUrl('https://example.com/large-archive.zip', '/extracted'))
 *     .inspect(() => console.log('Remote zip file unzipped successfully'));
 *
 * // With timeout
 * (await unzipStreamFromUrl('https://example.com/archive.zip', '/extracted', { timeout: 30000 }))
 *     .inspect(() => console.log('Remote zip file unzipped successfully'));
 * ```
 */
export async function unzipStreamFromUrl(zipFileUrl: string | URL, destDir: string, requestInit?: UnzipFromUrlRequestInit): AsyncVoidIOResult {
    const zipFileUrlRes = validateUrl(zipFileUrl);
    if (zipFileUrlRes.isErr()) return zipFileUrlRes.asErr();

    return unzipStreamWith(
        () => fetchT(zipFileUrlRes.unwrap(), {
            redirect: 'follow',
            ...requestInit,
            responseType: 'stream',
            abortable: false,
        }),
        destDir,
        createEmptyBodyError,
    );
}

/**
 * Common streaming unzip implementation for both local and remote sources.
 * @param getStream - Function to get the readable stream.
 * @param destDir - Destination directory path.
 * @param createEmptyError - Function to create error for empty data.
 */
async function unzipStreamWith(
    getStream: () => AsyncIOResult<ReadableStream<Uint8Array<ArrayBuffer>> | null>,
    destDir: string,
    createEmptyError: () => Error,
): AsyncVoidIOResult {
    const destDirRes = await validateDestDir(destDir);
    if (destDirRes.isErr()) return destDirRes.asErr();
    destDir = destDirRes.unwrap();

    const streamRes = await getStream();
    if (streamRes.isErr()) return streamRes.asErr();
    const stream = streamRes.unwrap();

    // stream can be null for 204/304 responses
    if (!stream) {
        return Err(createEmptyError());
    }

    return streamUnzipTo(stream, destDir, createEmptyError);
}

/**
 * Stream unzip from a ReadableStream to destination directory.
 * Uses fflate's streaming Unzip API to minimize memory usage.
 *
 * @param stream - The readable stream containing zip data.
 * @param destDir - Destination directory path.
 * @param createEmptyError - Function to create error for empty data.
 */
async function streamUnzipTo(
    stream: ReadableStream<Uint8Array<ArrayBuffer>>,
    destDir: string,
    createEmptyError: () => Error,
): AsyncVoidIOResult {
    // Track directories and files for proper handling
    const tasks: AsyncVoidIOResult[] = [];
    const dirs: string[] = [];
    const nonEmptyDirs = new Set<string>();
    let hasData = false;

    const unzipper = new Unzip();
    // Register decompression handlers
    unzipper.register(UnzipPassThrough); // For stored (uncompressed) files
    unzipper.register(AsyncUnzipInflate); // For deflated files

    unzipper.onfile = file => {
        const path = file.name;

        if (path.at(-1) === SEPARATOR) {
            // Directory entry - collect for later creation
            dirs.push(path.slice(0, -1));
        } else {
            // Create a promise for this file's extraction
            tasks.push(extractFile(file, join(destDir, path)));
            // File entry - mark parent directories as non-empty
            markParentDirsNonEmpty(path, nonEmptyDirs);
        }
    };

    try {
        for await (const chunk of stream) {
            hasData = true;
            unzipper.push(chunk, false);
        }
        // Signal end of stream
        unzipper.push(EMPTY_BYTES, true);
    } catch (err) {
        return Err(err as Error);
    }

    // Empty stream check
    if (!hasData) {
        return Err(createEmptyError());
    }

    // Add empty directory creation tasks
    for (const dir of dirs) {
        if (!nonEmptyDirs.has(dir)) {
            tasks.push(mkdir(join(destDir, dir)));
        }
    }

    return aggregateResults(tasks);
}

/**
 * Extract a single file from the unzip stream using streaming write.
 *
 * @param file - The UnzipFile object from fflate.
 * @param destPath - The destination path for this file.
 */
function extractFile(file: UnzipFile, destPath: string): AsyncVoidIOResult {
    // Convert UnzipFile to ReadableStream
    const stream = new ReadableStream<Uint8Array<ArrayBuffer>>({
        start(controller) {
            file.ondata = (err, data, final) => {
                if (err) {
                    controller.error(err);
                    return;
                }

                controller.enqueue(data as Uint8Array<ArrayBuffer>);

                if (final) {
                    controller.close();
                }
            };

            file.start();
        },
    });

    return writeFile(destPath, stream);
}
