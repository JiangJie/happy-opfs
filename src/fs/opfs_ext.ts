import { ABORT_ERROR, fetchT, type FetchTask } from '@happy-ts/fetch-t';
import { Err, Ok, type AsyncIOResult, type IOResult } from 'happy-rusty';
import { assertAbsolutePath, assertFileUrl } from './assertions.ts';
import { NOT_FOUND_ERROR } from './constants.ts';
import type { ExistsOptions, FsRequestInit, WriteFileContent } from './defines.ts';
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
    type T = boolean;

    const res = await readDir(dirPath);
    if (res.isErr()) {
        if (res.unwrapErr().name === NOT_FOUND_ERROR) {
            // 不存在则创建
            return mkdir(dirPath);
        }

        return res.asErr();
    }

    const items: AsyncIOResult<T>[] = [];

    for await (const [name] of res.unwrap()) {
        items.push(remove(`${ dirPath }/${ name }`));
    }

    const success: IOResult<T> = await Promise.all(items).then((x) => {
        let err: IOResult<T> | null = null;

        const success = x.every(y => {
            if (y.isErr()) {
                err = y;
                return false;
            }

            return y.unwrap();
        });

        return err ?? Ok(success);
    });

    return success;
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
        if (status.unwrapErr().name === NOT_FOUND_ERROR) {
            return Ok(false);
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
    assertFileUrl(fileUrl);
    assertAbsolutePath(filePath);

    let aborted = false;

    const fetchTask = fetchT(fileUrl, {
        redirect: 'follow',
        ...requestInit,
        abortable: true,
    });

    return {
        abort(...args: Parameters<typeof fetchTask.abort>): void {
            aborted = true;
            fetchTask.abort(...args);
        },

        aborted,

        response: Promise.resolve().then(async (): AsyncIOResult<Response> => {
            const result = await fetchTask.response;
            if (result.isErr()) {
                return result.asErr();
            }

            const res = result.unwrap();
            if (!res.ok) {
                return Err(new Error(`downloadFile fetch status: ${ res.status }`));
            }

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
        }).catch(err => {
            const errMsg: string = err?.message ?? `downloadFile fetch error ${ err }`;
            return Err(new Error(errMsg));
        }),
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
export function uploadFile(filePath: string, fileUrl: string, requestInit?: FsRequestInit): FetchTask<Response> {
    assertFileUrl(fileUrl);

    let aborted = false;

    let fetchTask: FetchTask<Response>;

    return {
        abort(...args: Parameters<typeof fetchTask.abort>): void {
            aborted = true;
            fetchTask?.abort(...args);
        },

        aborted,

        response: Promise.resolve().then(async (): AsyncIOResult<Response> => {
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

            fetchTask = fetchT(fileUrl, {
                method: 'POST',
                ...requestInit,
                abortable: true,
                body: fileResult.unwrap(),
            });

            const result = await fetchTask.response;
            if (result.isErr()) {
                return result.asErr();
            }

            const res = result.unwrap();
            if (!res.ok) {
                return Err(new Error(`uploadFile fetch status: ${ res.status }`));
            }

            return Ok(res);
        }).catch(err => {
            const errMsg: string = err?.message ?? `uploadFile fetch error ${ err }`;
            return Err(new Error(errMsg));
        }),
    };
}