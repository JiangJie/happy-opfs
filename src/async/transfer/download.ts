import { fetchT, type FetchResponse, type FetchTask } from '@happy-ts/fetch-t';
import { extname } from '@std/path/posix';
import { Err, Ok } from 'happy-rusty';
import type { DownloadFileTempResponse, FsRequestInit } from '../../shared/mod.ts';
import { writeFile } from '../core/mod.ts';
import { assertValidUrl, createAbortError, createEmptyBodyError, validateAbsolutePath } from '../internal/mod.ts';
import { generateTempPath } from '../tmp.ts';

/**
 * Downloads a file from a URL and saves it to a temporary file.
 * The returned response will contain the temporary file path.
 *
 * This API is built on `@happy-ts/fetch-t`.
 * - Supports `timeout` and `onProgress` via {@link FsRequestInit}
 * - Returns an abortable {@link FetchTask}
 *
 * @param fileUrl - The URL of the file to download.
 * @param requestInit - Optional request initialization parameters.
 * @returns A task that can be aborted and contains the result of the download.
 * @example
 * ```typescript
 * // Download to a temporary file
 * const task = downloadFile('https://example.com/file.pdf');
 * (await task.response)
 *     .inspect(({ tempFilePath }) => console.log(`File downloaded to: ${tempFilePath}`));
 * ```
 */
export function downloadFile(fileUrl: string | URL, requestInit?: FsRequestInit): FetchTask<DownloadFileTempResponse>;

/**
 * Downloads a file from a URL and saves it to the specified path.
 *
 * @param fileUrl - The URL of the file to download.
 * @param filePath - The path where the downloaded file will be saved.
 * @param requestInit - Optional request initialization parameters.
 * @returns A task that can be aborted and contains the result of the download.
 * @example
 * ```typescript
 * // Download to a specific path
 * const task = downloadFile('https://example.com/file.pdf', '/downloads/file.pdf');
 * (await task.response)
 *     .inspect(() => console.log('File downloaded successfully'));
 *
 * // Abort the download
 * task.abort();
 * ```
 */
export function downloadFile(fileUrl: string | URL, filePath: string, requestInit?: FsRequestInit): FetchTask<Response>;
export function downloadFile(fileUrl: string | URL, filePath?: string | FsRequestInit, requestInit?: FsRequestInit): FetchTask<Response | DownloadFileTempResponse> {
    type T = FetchResponse<Response | DownloadFileTempResponse>;

    fileUrl = assertValidUrl(fileUrl);

    let saveToTemp = false;

    if (typeof filePath === 'string') {
        const filePathRes = validateAbsolutePath(filePath);
        if (filePathRes.isErr()) {
            return {
                abort(): void { /* noop */ },
                get aborted(): boolean {
                    return false;
                },
                get response(): T {
                    return Promise.resolve(filePathRes.asErr());
                },
            };
        }
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

    const response = (async (): T => {
        const responseRes = await fetchTask.response;

        return responseRes.andThenAsync(async rawResponse => {
            // maybe aborted
            if (fetchTask.aborted) {
                return Err(createAbortError());
            }

            // body can be null for 204/304 responses or HEAD requests
            if (!rawResponse.body) {
                return Err(createEmptyBodyError());
            }

            // Use stream to avoid loading entire file into memory
            const writeRes = await writeFile(filePath, rawResponse.body);

            return writeRes.and(Ok(
                saveToTemp
                    ? {
                        tempFilePath: filePath,
                        rawResponse,
                    } satisfies DownloadFileTempResponse
                    : rawResponse,
            ));
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

        get response(): T {
            return response;
        },
    };
}