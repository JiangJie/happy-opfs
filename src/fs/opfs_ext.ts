import { fetchT, type FetchResponse, type FetchTask } from '@happy-ts/fetch-t';
import { basename, join, SEPARATOR } from '@std/path/posix';
import * as fflate from 'fflate/browser';
import { Err, Ok, RESULT_FALSE, RESULT_VOID, type AsyncIOResult, type AsyncVoidIOResult, type IOResult, type VoidIOResult } from 'happy-rusty';
import { Future } from 'tiny-future';
import invariant from 'tiny-invariant';
import { assertAbsolutePath, assertFileUrl } from './assertions.ts';
import { ABORT_ERROR } from './constants.ts';
import type { ExistsOptions, FsRequestInit, UploadRequestInit, WriteFileContent, ZipOptions } from './defines.ts';
import { getFileDataByHandle, isFileKind, isNotFoundError } from './helpers.ts';
import { mkdir, readDir, readFile, remove, stat, writeFile } from './opfs_core.ts';

/**
 * Appends content to a file at the specified path.
 *
 * @param filePath - The path of the file to append to.
 * @param contents - The content to append to the file.
 * @returns A promise that resolves to an `AsyncIOResult` indicating whether the content was successfully appended.
 */
export function appendFile(filePath: string, contents: WriteFileContent): AsyncVoidIOResult {
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
export async function emptyDir(dirPath: string): AsyncVoidIOResult {
    const res = await readDir(dirPath);

    if (res.isErr()) {
        // create if not exist
        return isNotFoundError(res.unwrapErr()) ? mkdir(dirPath) : res.asErr();
    }

    const tasks: AsyncVoidIOResult[] = [];

    for await (const { path } of res.unwrap()) {
        tasks.push(remove(join(dirPath, path)));
    }

    const allRes = await Promise.all(tasks);
    // anyone failed?
    const fail = allRes.find(x => x.isErr());

    return fail ?? RESULT_VOID;
}

/**
 * Checks whether a file or directory exists at the specified path.
 *
 * @param path - The path of the file or directory to check for existence.
 * @param options - Optional existence options.
 * @returns A promise that resolves to an `AsyncIOResult` indicating whether the file or directory exists.
 */
export async function exists(path: string, options?: ExistsOptions): AsyncIOResult<boolean> {
    const { isDirectory = false, isFile = false } = options ?? {};

    invariant(!(isDirectory && isFile), () => 'ExistsOptions.isDirectory and ExistsOptions.isFile must not be true together.');

    const stats = await stat(path);

    return stats.andThen(handle => {
        const { kind } = handle;
        const notExist =
            (isDirectory && kind === 'file')
            || (isFile && kind === 'directory');

        return Ok(!notExist);
    }).orElse((err): IOResult<boolean> => {
        return isNotFoundError(err) ? RESULT_FALSE : stats.asErr();
    });
}

/**
 * Reads the content of a file at the specified path as a File.
 *
 * @param filePath - The path of the file to read.
 * @returns A promise that resolves to an `AsyncIOResult` containing the file content as a File.
 */
export function readBlobFile(filePath: string): AsyncIOResult<File> {
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

/**
 * Unzip a zip file to a directory.
 * Equivalent to `unzip -o <zipFilePath> -d <targetPath>
 * @param zipFilePath - Zip file path.
 * @param targetPath - The directory to unzip to.
 * @returns A promise that resolves to an `AsyncIOResult` indicating whether the zip file was successfully unzipped.
 */
export async function unzip(zipFilePath: string, targetPath: string): AsyncVoidIOResult {
    assertAbsolutePath(targetPath);

    const res = await readFile(zipFilePath);
    if (res.isErr()) {
        return res.asErr();
    }

    const future = new Future<VoidIOResult>();

    const data = new Uint8Array(res.unwrap());

    fflate.unzip(data, async (err, unzipped) => {
        if (err) {
            future.resolve(Err(err));
            return;
        }

        const tasks: AsyncVoidIOResult[] = [];
        for (const path in unzipped) {
            // ignore directory
            if (path.at(-1) !== SEPARATOR) {
                tasks.push(writeFile(join(targetPath, path), unzipped[path]));
            }
        }

        const allRes = await Promise.all(tasks);
        // anyone failed?
        const fail = allRes.find(x => x.isErr());

        return future.resolve(fail ?? RESULT_VOID);
    });

    return await future.promise;
}

/**
 * Zip a file or directory.
 * Equivalent to `zip -r <zipFilePath> <targetPath>`.
 * @param sourcePath - The path to be zipped.
 * @param zipFilePath - The path to the zip file.
 * @param options - Options of zip.
 * @returns A promise that resolves to an `AsyncIOResult` indicating whether the source was successfully zipped.
 */
export async function zip(sourcePath: string, zipFilePath: string, options?: ZipOptions): AsyncVoidIOResult {
    assertAbsolutePath(zipFilePath);

    const statRes = await stat(sourcePath);
    if (statRes.isErr()) {
        return statRes.asErr();
    }

    const future = new Future<VoidIOResult>();

    const zipped: fflate.AsyncZippable = {};

    const sourceName = basename(sourcePath);
    const handle = statRes.unwrap();

    if (isFileKind(handle.kind)) {
        // file
        const data = await getFileDataByHandle(handle);
        zipped[sourceName] = data;
    } else {
        // directory
        const res = await readDir(sourcePath, {
            recursive: true,
        });
        if (res.isErr()) {
            return res.asErr();
        }

        // default to preserve root
        const preserveRoot = options?.preserveRoot ?? true;

        for await (const { path, handle } of res.unwrap()) {
            // path
            if (isFileKind(handle.kind)) {
                const entryName = preserveRoot ? join(sourceName, path) : path;
                const data = await getFileDataByHandle(handle);
                zipped[entryName] = data;
            }
        }
    }

    fflate.zip(zipped, {
        consume: true,
    }, async (err, u8a) => {
        if (err) {
            future.resolve(Err(err));
            return;
        }

        const res = await writeFile(zipFilePath, u8a);
        future.resolve(res);
    });

    return await future.promise;
}