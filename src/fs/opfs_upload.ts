import { fetchT, type FetchResponse, type FetchTask } from '@happy-ts/fetch-t';
import { basename } from '@std/path/posix';
import { Err } from 'happy-rusty';
import { assertFileUrl } from './assertions.ts';
import type { UploadRequestInit } from './defines.ts';
import { createAbortError } from './helpers.ts';
import { readBlobFile } from './opfs_ext.ts';

/**
 * Uploads a file from the specified path to a URL.
 *
 * @param filePath - The path of the file to upload.
 * @param fileUrl - The URL where the file will be uploaded.
 * @param requestInit - Optional request initialization parameters.
 * @returns A task that can be aborted and contains the result of the upload.
 * @example
 * ```typescript
 * const task = uploadFile('/documents/report.pdf', 'https://example.com/upload');
 * (await task.response)
 *     .inspect(() => console.log('File uploaded successfully'));
 *
 * // Abort the upload
 * task.abort();
 * ```
 */
export function uploadFile(filePath: string, fileUrl: string | URL, requestInit?: UploadRequestInit): FetchTask<Response> {
    type T = Response;

    assertFileUrl(fileUrl);

    let aborted = false;

    let fetchTask: FetchTask<T>;

    const response = (async (): FetchResponse<T> => {
        const fileRes = await readBlobFile(filePath);

        return fileRes.andThenAsync(async file => {
            // maybe aborted
            if (aborted) {
                return Err(createAbortError());
            }

            const {
                // default file name
                filename = basename(filePath),
                ...rest
            } = requestInit ?? {};

            const formData = new FormData();
            formData.append(filename, file, filename);

            fetchTask = fetchT(fileUrl, {
                method: 'POST',
                ...rest,
                abortable: true,
                body: formData,
            });

            return fetchTask.response;
        });
    })();

    return {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        abort(reason?: any): void {
            aborted = true;
            fetchTask?.abort(reason);
        },

        get aborted(): boolean {
            return aborted;
        },

        get response(): FetchResponse<T> {
            return response;
        },
    };
}