import { fetchT, type FetchResult, type FetchTask } from '@happy-ts/fetch-t';
import { basename } from '@std/path/posix';
import { Err } from 'happy-rusty';
import type { UploadRequestInit } from '../../shared/mod.ts';
import { readBlobFile } from '../ext.ts';
import { createAbortError, createFailedFetchTask, validateAbsolutePath, validateUrl } from '../internal/mod.ts';

/**
 * Uploads a file from the specified path to a URL.
 *
 * This API is built on `@happy-ts/fetch-t`.
 * - Supports `timeout` and `onProgress` via {@link UploadRequestInit}
 * - Returns an abortable {@link FetchTask}
 *
 * @param filePath - The path of the file to upload.
 * @param uploadUrl - The URL where the file will be uploaded.
 * @param requestInit - Optional request initialization parameters.
 * @returns A task that can be aborted and contains the result of the upload.
 * @example
 * ```typescript
 * const task = uploadFile('/documents/report.pdf', 'https://example.com/upload');
 * (await task.result)
 *     .inspect(() => console.log('File uploaded successfully'));
 *
 * // Abort the upload
 * task.abort();
 * ```
 */
export function uploadFile(filePath: string, uploadUrl: string | URL, requestInit?: UploadRequestInit): FetchTask<Response> {
    const filePathRes = validateAbsolutePath(filePath);
    if (filePathRes.isErr()) return createFailedFetchTask(filePathRes);
    filePath = filePathRes.unwrap();

    const uploadUrlRes = validateUrl(uploadUrl);
    if (uploadUrlRes.isErr()) return createFailedFetchTask(uploadUrlRes);
    uploadUrl = uploadUrlRes.unwrap();

    let aborted = false;
    let fetchTask: FetchTask<Response>;

    const result = (async (): FetchResult<Response> => {
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

            fetchTask = fetchT(uploadUrl, {
                method: 'POST',
                ...rest,
                abortable: true,
                body: formData,
            });

            return fetchTask.result;
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

        get result(): FetchResult<Response> {
            return result;
        },
    };
}