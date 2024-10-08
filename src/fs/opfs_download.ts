import { fetchT, type FetchResponse, type FetchTask } from '@happy-ts/fetch-t';
import { extname } from '@std/path/posix';
import { Err, Ok } from 'happy-rusty';
import { assertAbsolutePath, assertFileUrl } from './assertions.ts';
import type { DownloadFileTempResponse, FsRequestInit } from './defines.ts';
import { createAbortError } from './helpers.ts';
import { writeFile } from './opfs_core.ts';
import { generateTempPath } from './utils.ts';

/**
 * Downloads a file from a URL and saves it to a temporary file.
 * The returned response will contain the temporary file path.
 *
 * @param fileUrl - The URL of the file to download.
 * @param requestInit - Optional request initialization parameters.
 * @returns A task that can be aborted and contains the result of the download.
 */
export function downloadFile(fileUrl: string, requestInit?: FsRequestInit): FetchTask<DownloadFileTempResponse>;
/**
 * Downloads a file from a URL and saves it to the specified path.
 *
 * @param fileUrl - The URL of the file to download.
 * @param filePath - The path where the downloaded file will be saved.
 * @param requestInit - Optional request initialization parameters.
 * @returns A task that can be aborted and contains the result of the download.
 */
export function downloadFile(fileUrl: string, filePath: string, requestInit?: FsRequestInit): FetchTask<Response>;
export function downloadFile(fileUrl: string, filePath?: string | FsRequestInit, requestInit?: FsRequestInit): FetchTask<Response | DownloadFileTempResponse> {
    assertFileUrl(fileUrl);

    let saveToTemp = false;

    if (typeof filePath === 'string') {
        assertAbsolutePath(filePath);
    } else {
        requestInit = filePath;
        // save to a temporary file, reserve the extension
        filePath = generateTempPath({
            extname: extname(fileUrl),
        });
        saveToTemp = true;
    }

    let aborted = false;

    const fetchTask = fetchT(fileUrl, {
        redirect: 'follow',
        ...requestInit,
        abortable: true,
    });

    const response = (async (): FetchResponse<Response> => {
        const responseRes = await fetchTask.response;

        return responseRes.andThenAsync(async response => {
            const blob = await response.blob();

            // maybe aborted
            if (aborted) {
                return Err(createAbortError());
            }

            const writeRes = await writeFile(filePath, blob);

            return writeRes.and(Ok(response));
        });
    })();

    return {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        abort(reason?: any): void {
            aborted = true;
            fetchTask.abort(reason);
        },

        get aborted(): boolean {
            return aborted;
        },

        get response(): FetchResponse<Response | DownloadFileTempResponse> {
            return saveToTemp
                ? response.then(res => {
                    return res.map<DownloadFileTempResponse>(rawResponse => {
                        return {
                            tempFilePath: filePath,
                            rawResponse,
                        };
                    });
                })
                : response;
        },
    };
}