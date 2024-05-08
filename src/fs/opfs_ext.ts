import { Err, Ok, type AsyncIOResult } from '@happy-js/happy-rusty';
import { assertAbsolutePath, assertFileUrl } from './assertions.ts';
import { NOT_FOUND_ERROR } from './constants.ts';
import type { ExistsOptions, WriteFileContent } from './defines.ts';
import { readFile, stat, writeFile } from './opfs_core.ts';

/**
 * 将内容写入文件末尾
 * @param filePath 要写入的文件路径
 * @param contents 写入内容
 * @returns
 */
export function appendFile(filePath: string, contents: WriteFileContent): AsyncIOResult<boolean> {
    return writeFile(filePath, contents, {
        append: true,
    });
}

/**
 * 检查路径是否存在
 * @param path 要检查的文件（夹）路径
 */
export async function exists(path: string, options?: ExistsOptions): AsyncIOResult<boolean> {
    const status = await stat(path);
    if (status.isErr()) {
        if (status.err().name === NOT_FOUND_ERROR) {
            return Ok(false);
        }
        // reuse
        return status;
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
 * 以Blob格式读取文件
 * @param filePath 要读取的文件路径
 * @returns
 */
export function readBlobFile(filePath: string): AsyncIOResult<Blob> {
    return readFile(filePath, {
        encoding: 'blob',
    });
}

/**
 * 以字符串格式读取文件
 * @param filePath 要读取的文件路径
 * @returns
 */
export function readTextFile(filePath: string): AsyncIOResult<string> {
    return readFile(filePath, {
        encoding: 'utf8',
    });
}

/**
 * 下载文件保存到本地
 * @param fileUrl 要下载的文件url
 * @param filePath 保存到本地的文件路径
 * @param requestInit 传递给`fetch`的参数
 * @returns
 */
export function downloadFile(fileUrl: string, filePath: string, requestInit?: RequestInit): AsyncIOResult<boolean> {
    assertFileUrl(fileUrl);
    assertAbsolutePath(filePath);

    return fetch(fileUrl, {
        redirect: 'follow',
        ...requestInit,
    }).then(res => {
        if (!res.ok) {
            return Err<boolean, Error>(new Error(`downloadFile fetch status: ${ res.status }`));
        }

        return res.blob().then(blob => {
            return writeFile(filePath, blob);
        });
    }).catch(err => {
        const errMsg: string = err?.message ?? `downloadFile fetch error ${ err }`;
        return Err(new Error(errMsg));
    });
}

/**
 * 上传文件
 * @param filePath 本地文件路径
 * @param fileUrl 上传url
 * @param requestInit 传递给`fetch`的参数
 * @returns
 */
export async function uploadFile(filePath: string, fileUrl: string, requestInit?: RequestInit): AsyncIOResult<boolean> {
    assertFileUrl(fileUrl);

    const data = await readBlobFile(filePath);
    if (data.isErr()) {
        return data;
    }

    return fetch(fileUrl, {
        method: 'POST',
        ...requestInit,
        body: data.unwrap(),
    }).then(res => {
        if (!res.ok) {
            return Err<boolean, Error>(new Error(`uploadFile fetch status: ${ res.status }`));
        }

        return Ok<boolean, Error>(true);
    }).catch(err => {
        const errMsg: string = err?.message ?? `uploadFile fetch error ${ err }`;
        return Err(new Error(errMsg));
    });
}