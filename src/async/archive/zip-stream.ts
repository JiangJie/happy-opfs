import { fetchT } from '@happy-ts/fetch-t';
import { basename, join, SEPARATOR } from '@std/path/posix';
import { Zip, ZipDeflate, ZipPassThrough, zipSync } from 'fflate/browser';
import { Err, tryAsyncResult, type AsyncVoidIOResult } from 'happy-rusty';
import { isFileHandle, type DirEntry, type ZipFromUrlRequestInit, type ZipOptions } from '../../shared/mod.ts';
import { readDir, stat, writeFile } from '../core/mod.ts';
import { createEmptyBodyError, createNothingToZipError, peekStream, validateAbsolutePath, validateUrl } from '../internal/mod.ts';
import { EMPTY_BYTES } from './helpers.ts';

/**
 * Zip a file or directory using streaming compression.
 * Equivalent to `zip -r <zipFilePath> <sourcePath>`.
 *
 * This function processes files sequentially with streaming read/write,
 * minimizing memory usage. Recommended for large directories or files.
 * For better speed with small files, consider using {@link zip} instead.
 *
 * Use [fflate](https://github.com/101arrowz/fflate) as the zip backend.
 *
 * @param sourcePath - The path to be zipped.
 * @param zipFilePath - The path to the zip file.
 * @param options - Options of zip.
 * @returns A promise that resolves to an `AsyncIOResult` indicating whether the source was successfully zipped.
 * @example
 * ```typescript
 * // Stream zip a large directory
 * (await zipStream('/large-documents', '/backups/documents.zip'))
 *     .inspect(() => console.log('Directory zipped successfully'));
 * ```
 */
export async function zipStream(sourcePath: string, zipFilePath: string, options?: ZipOptions): AsyncVoidIOResult {
    const zipFilePathRes = validateAbsolutePath(zipFilePath);
    if (zipFilePathRes.isErr()) return zipFilePathRes.asErr();
    zipFilePath = zipFilePathRes.unwrap();

    const statRes = await stat(sourcePath);
    if (statRes.isErr()) return statRes.asErr();

    const sourceHandle = statRes.unwrap();
    const sourceName = basename(sourcePath);

    if (isFileHandle(sourceHandle)) {
        // Single file - stream read and compress
        return streamZipFile(sourceHandle, sourceName, zipFilePath);
    }

    // Directory - stream compress entries directly
    const readDirRes = await readDir(sourcePath, { recursive: true });
    if (readDirRes.isErr()) return readDirRes.asErr();

    const { preserveRoot = true } = options ?? {};
    const entries = readDirRes.unwrap();

    // Peek first entry to check if directory is empty
    const firstRes = await tryAsyncResult(entries.next());
    if (firstRes.isErr()) return firstRes.asErr();

    const first = firstRes.unwrap();
    if (first.done && !preserveRoot) {
        // Empty directory with preserveRoot=false - nothing to zip
        // Matches zip command: `zip -r archive.zip .` in empty dir returns "Nothing to do!"
        return Err(createNothingToZipError());
    }

    return streamZipEntries(
        first,
        entries,
        sourceName,
        zipFilePath,
        preserveRoot,
    );
}

/**
 * Zip a remote file using streaming compression.
 *
 * This function downloads and compresses the file in a streaming manner,
 * minimizing memory usage. Recommended for large remote files.
 * For small files, consider using {@link zipFromUrl} instead.
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
 * // Stream zip a large remote file
 * (await zipStreamFromUrl('https://example.com/large-file.bin', '/backups/file.zip'))
 *     .inspect(() => console.log('Remote file zipped successfully'));
 * ```
 */
export async function zipStreamFromUrl(sourceUrl: string | URL, zipFilePath: string, requestInit?: ZipFromUrlRequestInit): AsyncVoidIOResult {
    const sourceUrlRes = validateUrl(sourceUrl);
    if (sourceUrlRes.isErr()) return sourceUrlRes.asErr();
    sourceUrl = sourceUrlRes.unwrap();

    const zipFilePathRes = validateAbsolutePath(zipFilePath);
    if (zipFilePathRes.isErr()) return zipFilePathRes.asErr();
    zipFilePath = zipFilePathRes.unwrap();

    // Fetch as stream for true streaming
    const fetchRes = await fetchT(sourceUrl, {
        redirect: 'follow',
        ...requestInit,
        responseType: 'stream',
        abortable: false,
    });

    if (fetchRes.isErr()) return fetchRes.asErr();

    const stream = fetchRes.unwrap();
    const { filename, keepEmptyBody = false } = requestInit ?? {};
    // Use provided filename, or basename of pathname, or 'file' as fallback
    const sourceName = filename ?? (sourceUrl.pathname !== SEPARATOR ? basename(sourceUrl.pathname) : 'file');

    // Handle null stream (204/304 responses or HEAD requests)
    if (!stream) {
        return keepEmptyBody
            ? zipEmptyFile(sourceName, zipFilePath)
            : Err(createEmptyBodyError());
    }

    // Peek first chunk to check for empty body
    const peekRes = await peekStream(stream);
    if (peekRes.isErr()) return peekRes.asErr();

    const peek = peekRes.unwrap();

    if (peek.isEmpty) {
        return keepEmptyBody
            ? zipEmptyFile(sourceName, zipFilePath)
            : Err(createEmptyBodyError());
    }

    return streamZipFromStream(peek.stream, sourceName, zipFilePath);
}

// #region Internal Functions

/**
 * Create a Zip instance with callback that pipes to controller.
 */
function createZip(controller: ReadableStreamDefaultController<Uint8Array<ArrayBuffer>>): Zip {
    return new Zip((err, chunk, final) => {
        if (err) {
            controller.error(err);
            return;
        }

        controller.enqueue(chunk as Uint8Array<ArrayBuffer>);

        if (final) {
            controller.close();
        }
    });
}

/**
 * Add an empty entry (directory or empty file) to zip.
 */
function addEmptyEntry(zip: Zip, entryName: string): void {
    const entry = new ZipPassThrough(entryName);
    zip.add(entry);
    entry.push(EMPTY_BYTES, true);
}

/**
 * Stream zip a single file handle.
 */
async function streamZipFile(fileHandle: FileSystemFileHandle, entryName: string, zipFilePath: string): AsyncVoidIOResult {
    const fileRes = await tryAsyncResult(fileHandle.getFile());

    return fileRes.andThenAsync(file => {
        return file.size === 0
            ? zipEmptyFile(entryName, zipFilePath)
            : streamZipFromStream(file.stream(), entryName, zipFilePath);
    });
}

/**
 * Stream zip from a ReadableStream source.
 */
function streamZipFromStream(
    sourceStream: ReadableStream<Uint8Array<ArrayBuffer>>,
    entryName: string,
    zipFilePath: string,
): AsyncVoidIOResult {
    const zipStream = new ReadableStream<Uint8Array<ArrayBuffer>>({
        async start(controller) {
            const zip = createZip(controller);
            const entry = new ZipDeflate(entryName);
            zip.add(entry);

            try {
                for await (const chunk of sourceStream) {
                    entry.push(chunk, false);
                }
                entry.push(EMPTY_BYTES, true);
                zip.end();
            } catch (err) {
                controller.error(err);
            }
        },
    });

    return writeFile(zipFilePath, zipStream);
}

/**
 * Create a zip with an empty file entry.
 *
 * This is preferred over streaming for empty files/bodies to avoid creating
 * unnecessary ReadableStream, Zip, and ZipDeflate instances.
 */
function zipEmptyFile(entryName: string, zipFilePath: string): AsyncVoidIOResult {
    const data = zipSync({
        [entryName]: EMPTY_BYTES,
    }) as Uint8Array<ArrayBuffer>;
    return writeFile(zipFilePath, data);
}

/**
 * Stream zip multiple directory entries sequentially.
 */
function streamZipEntries(
    first: IteratorResult<DirEntry>,
    rest: AsyncIterableIterator<DirEntry>,
    sourceName: string,
    zipFilePath: string,
    preserveRoot: boolean,
): AsyncVoidIOResult {
    const zipStream = new ReadableStream<Uint8Array<ArrayBuffer>>({
        async start(controller) {
            const zip = createZip(controller);

            // Add root directory entry first
            if (preserveRoot) {
                addEmptyEntry(zip, sourceName + SEPARATOR);
            }

            // Helper to process a single entry
            const processEntry = async ({ path, handle }: DirEntry): Promise<void> => {
                const entryName = preserveRoot ? join(sourceName, path) : path;

                // Directory entry
                if (!isFileHandle(handle)) {
                    addEmptyEntry(zip, entryName + SEPARATOR);
                    return;
                }

                // File entry - stream read and compress
                const file = await handle.getFile();
                const entry = new ZipDeflate(entryName);
                zip.add(entry);

                for await (const chunk of file.stream()) {
                    entry.push(chunk, false);
                }
                entry.push(EMPTY_BYTES, true);
            };

            try {
                // Process peeked first entry
                if (!first.done) {
                    await processEntry(first.value);
                }

                // Process remaining entries
                for await (const dirEntry of rest) {
                    await processEntry(dirEntry);
                }

                zip.end();
            } catch (err) {
                controller.error(err);
            }
        },
    });

    return writeFile(zipFilePath, zipStream);
}

// #endregion
