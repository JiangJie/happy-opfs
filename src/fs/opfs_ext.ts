import { fetchT, type FetchResponse, type FetchTask } from '@happy-ts/fetch-t';
import { basename, join } from '@std/path/posix';
import { Err, Ok, RESULT_FALSE, RESULT_TRUE, type AsyncIOResult } from 'happy-rusty';
import { assertAbsolutePath, assertFileUrl } from './assertions.ts';
import { ABORT_ERROR } from './constants.ts';
import type { ExistsOptions, FsRequestInit, UploadRequestInit, WriteFileContent } from './defines.ts';
import { isNotFoundError } from './helpers.ts';
import { mkdir, readDir, readFile, remove, stat, writeFile } from './opfs_core.ts';

/**
 * Appends content to a file at the specified path.
 *
 * @param filePath - The path of the file to append to.
 * @param contents - The content to append to the file.
 * @returns A promise that resolves to an `AsyncIOResult` indicating whether the content was successfully appended.
 */
export function appendFile(filePath: string, contents: WriteFileContent): AsyncIOResult<boolean> {
    return writeFile(filePath, contents, {
        append: true,
    });
}

/**
 * Empties the contents of a directory at the specified path.
 *
 * @param dirPath - The path of the directory to empty.
 * @returns A promise that resolves to an `AsyncIOResult` indicating whether the directory was successfully emptied.
 */
export async function emptyDir(dirPath: string): AsyncIOResult<boolean> {
    const res = await readDir(dirPath);
    if (res.isErr()) {
        if (isNotFoundError(res.unwrapErr())) {
            // 不存在则创建
            return mkdir(dirPath);
        }

        return res.asErr();
    }

    const tasks: AsyncIOResult<boolean>[] = [];

    for await (const { path } of res.unwrap()) {
        tasks.push(remove(join(dirPath, path)));
    }

    const allRes = await Promise.all(tasks);
    // anyone failed?
    const fail = allRes.find(x => x.isErr() || !x.unwrap());

    return fail ?? RESULT_TRUE;
}

/**
 * Checks whether a file or directory exists at the specified path.
 *
 * @param path - The path of the file or directory to check for existence.
 * @param options - Optional existence options.
 * @returns A promise that resolves to an `AsyncIOResult` indicating whether the file or directory exists.
 */
export async function exists(path: string, options?: ExistsOptions): AsyncIOResult<boolean> {
    const status = await stat(path);
    if (status.isErr()) {
        if (isNotFoundError(status.unwrapErr())) {
            return RESULT_FALSE;
        }
        return status.asErr();
    }

    const { isDirectory = false, isFile = false } = options ?? {};

    if (isDirectory && isFile) {
        throw new TypeError('ExistsOptions.isDirectory and ExistsOptions.isFile must not be true together.');
    }

    const { kind } = status.unwrap();
    const notExist =
        (isDirectory && kind === 'file')
        || (isFile && kind === 'directory');

    return Ok(!notExist);
}

/**
 * Reads the content of a file at the specified path as a Blob.
 *
 * @param filePath - The path of the file to read.
 * @returns A promise that resolves to an `AsyncIOResult` containing the file content as a Blob.
 */
export function readBlobFile(filePath: string): AsyncIOResult<Blob> {
    return readFile(filePath, {
        encoding: 'blob',
    });
}

/**
 * Reads the content of a file at the specified path as a string.
 *
 * @param filePath - The path of the file to read.
 * @returns A promise that resolves to an `AsyncIOResult` containing the file content as a string.
 */
export function readTextFile(filePath: string): AsyncIOResult<string> {
    return readFile(filePath, {
        encoding: 'utf8',
    });
}

/**
 * Downloads a file from a URL and saves it to the specified path.
 *
 * @param fileUrl - The URL of the file to download.
 * @param filePath - The path where the downloaded file will be saved.
 * @param requestInit - Optional request initialization parameters.
 * @returns A promise that resolves to an `AsyncIOResult` indicating whether the file was successfully downloaded and saved.
 */
export function downloadFile(fileUrl: string, filePath: string, requestInit?: FsRequestInit): FetchTask<Response> {
    type T = Response;

    assertFileUrl(fileUrl);
    assertAbsolutePath(filePath);

    let aborted = false;

    const fetchTask = fetchT(fileUrl, {
        redirect: 'follow',
        ...requestInit,
        abortable: true,
    });

    const response = (async (): FetchResponse<T> => {
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

        get response(): FetchResponse<T> {
            return response;
        },
    };
}

/**
 * Uploads a file from the specified path to a URL.
 *
 * @param filePath - The path of the file to upload.
 * @param fileUrl - The URL where the file will be uploaded.
 * @param requestInit - Optional request initialization parameters.
 * @returns A promise that resolves to an `AsyncIOResult` indicating whether the file was successfully uploaded.
 */
export function uploadFile(filePath: string, fileUrl: string, requestInit?: UploadRequestInit): FetchTask<Response> {
    type T = Response;

    assertFileUrl(fileUrl);

    let aborted = false;

    let fetchTask: FetchTask<T>;

    const response = (async (): FetchResponse<T> => {
        const fileResult = await readBlobFile(filePath)
        if (fileResult.isErr()) {
            return fileResult.asErr();
        }

        // maybe aborted
        if (aborted) {
            const error = new Error();
            error.name = ABORT_ERROR;
            return Err(error);
        }

        const {
            // default file name
            filename = basename(filePath),
            ...rest
        } = requestInit ?? {};

        const formData = new FormData();
        formData.append(filename, fileResult.unwrap(), filename);

        fetchTask = fetchT(fileUrl, {
            method: 'POST',
            ...rest,
            abortable: true,
            body: formData,
        });

        return await fetchTask.response;
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