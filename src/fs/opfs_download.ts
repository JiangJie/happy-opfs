import { fetchT, type FetchResponse, type FetchTask } from '@happy-ts/fetch-t';
import { Err, Ok } from 'happy-rusty';
import { assertAbsolutePath, assertFileUrl } from './assertions.ts';
import { ABORT_ERROR } from './constants.ts';
import type { DownloadFileTempResponse, FsRequestInit } from './defines.ts';
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
        // save to a temporary file
        filePath = generateTempPath();
        saveToTemp = true;
    }

    let aborted = false;

    const fetchTask = fetchT(fileUrl, {
        redirect: 'follow',
        ...requestInit,
        abortable: true,
    });

    const response = (async (): FetchResponse<Response> => {
        const result = await fetchTask.response;
        if (result.isErr()) {
            return result.asErr();
        }

        const res = result.unwrap();

        const blob = await res.blob();

        // maybe aborted
        if (aborted) {
            const error = new Error();
            error.name = ABORT_ERROR;
            return Err(error);
        }

        const writeResult = await writeFile(filePath, blob);
        if (writeResult.isErr()) {
            return writeResult.asErr();
        }

        return Ok(res);
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
            if (saveToTemp) {
                return response.then(res => {
                    return res.map<DownloadFileTempResponse>(rawResponse => {
                        return {
                            filePath,
                            rawResponse,
                        };
                    });
                });
            } else {
                return response;
            }
        },
    };
}