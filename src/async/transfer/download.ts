import { fetchT, type FetchResult, type FetchTask } from '@happy-ts/fetch-t';
import { extname } from '@std/path/posix';
import { Err, Ok } from 'happy-rusty';
import type { DownloadFileTempResponse, DownloadRequestInit } from '../../shared/mod.ts';
import { createFile, writeFile } from '../core/mod.ts';
import { createEmptyBodyError, createFailedFetchTask, peekStream, validateAbsolutePath, validateUrl } from '../internal/mod.ts';
import { generateTempPath } from '../tmp.ts';

/**
 * Downloads a file from a URL and saves it to a temporary file.
 * The returned response will contain the temporary file path.
 *
 * This API is built on `@happy-ts/fetch-t`.
 * - Supports `timeout` and `onProgress` via {@link DownloadRequestInit}
 * - Supports `keepEmptyBody` to allow saving empty responses
 * - Returns an abortable {@link FetchTask}
 *
 * @param fileUrl - The URL of the file to download.
 * @param requestInit - Optional request initialization parameters.
 * @returns A task that can be aborted and contains the result of the download.
 * @since 1.0.4
 * @see {@link uploadFile} for the reverse operation
 * @see {@link unzipFromUrl} for downloading and extracting zip files
 * @example
 * ```typescript
 * // Download to a temporary file
 * const task = downloadFile('https://example.com/file.pdf');
 * (await task.result)
 *     .inspect(({ tempFilePath }) => console.log(`File downloaded to: ${ tempFilePath }`));
 * ```
 */
export function downloadFile(fileUrl: string | URL, requestInit?: DownloadRequestInit): FetchTask<DownloadFileTempResponse>;

/**
 * Downloads a file from a URL and saves it to the specified path.
 *
 * @param fileUrl - The URL of the file to download.
 * @param filePath - The path where the downloaded file will be saved.
 * @param requestInit - Optional request initialization parameters.
 * @returns A task that can be aborted and contains the result of the download.
 * @since 1.0.4
 * @see {@link uploadFile} for the reverse operation
 * @see {@link unzipFromUrl} for downloading and extracting zip files
 * @example
 * ```typescript
 * // Download to a specific path
 * const task = downloadFile('https://example.com/file.pdf', '/downloads/file.pdf');
 * (await task.result)
 *     .inspect(() => console.log('File downloaded successfully'));
 *
 * // Abort the download
 * task.abort();
 * ```
 */
export function downloadFile(fileUrl: string | URL, filePath: string, requestInit?: DownloadRequestInit): FetchTask<Response>;
export function downloadFile(fileUrl: string | URL, filePath?: string | DownloadRequestInit, requestInit?: DownloadRequestInit): FetchTask<Response | DownloadFileTempResponse> {
    type T = FetchResult<Response | DownloadFileTempResponse>;

    const fileUrlRes = validateUrl(fileUrl);
    if (fileUrlRes.isErr()) return createFailedFetchTask(fileUrlRes);
    fileUrl = fileUrlRes.unwrap();

    let saveToTemp = false;

    if (typeof filePath === 'string') {
        const filePathRes = validateAbsolutePath(filePath);
        if (filePathRes.isErr()) return createFailedFetchTask(filePathRes);
        filePath = filePathRes.unwrap();
    } else {
        requestInit = filePath;
        // save to a temporary file, preserve the extension from URL
        filePath = generateTempPath({
            extname: extname(fileUrl.pathname),
        });
        saveToTemp = true;
    }

    const fetchTask = fetchT(fileUrl, {
        redirect: 'follow',
        ...requestInit,
        abortable: true,
    });

    const result = (async (): T => {
        const responseRes = await fetchTask.result;

        return responseRes.andThenAsync(async rawResponse => {
            function okResult() {
                return Ok(
                    saveToTemp
                        ? {
                            tempFilePath: filePath as string,
                            rawResponse,
                        } satisfies DownloadFileTempResponse
                        : rawResponse,
                );
            }

            // Handle empty body: return error or create empty file
            async function handleEmptyBody() {
                const { keepEmptyBody = false } = requestInit ?? {};

                if (!keepEmptyBody) {
                    return Err(createEmptyBodyError());
                }

                const createRes = await createFile(filePath as string);
                return createRes.and(okResult());
            }

            // Use peek approach for true streaming while detecting empty body
            // Note: browsers don't conform to spec (body should be null for 204/HEAD responses)
            // See: https://developer.mozilla.org/en-US/docs/Web/API/Response/body
            const { body } = rawResponse;

            // body is null - treat as empty
            if (!body) {
                return handleEmptyBody();
            }

            // Peek first chunk to detect empty stream
            const peekRes = await peekStream(body);
            if (peekRes.isErr()) return peekRes.asErr();

            const peek = peekRes.unwrap();
            if (peek.isEmpty) {
                return handleEmptyBody();
            }

            // True streaming write with reconstructed stream
            const writeRes = await writeFile(filePath, peek.stream);

            return writeRes.and(okResult());
        });
    })();

    return {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        abort(reason?: any): void {
            fetchTask.abort(reason);
        },

        get aborted(): boolean {
            return fetchTask.aborted;
        },

        get result(): T {
            return result;
        },
    };
}