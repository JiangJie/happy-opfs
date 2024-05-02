import { Ok } from '@happy-js/happy-rusty';
import { NOT_FOUND_ERROR } from './constants.ts';
import { FileEncoding, type ExistsOptions, type FsAsyncResult, type WriteFileContent } from './defines.ts';
import { readFile, stat, writeFile } from './opfs_core.ts';

/**
 * 将内容写入文件末尾
 * @param filePath 要写入的文件路径
 * @param contents 写入内容
 * @returns
 */
export function appendFile(filePath: string, contents: WriteFileContent): FsAsyncResult<boolean> {
    return writeFile(filePath, contents, {
        append: true,
    });
}

/**
 * 检查路径是否存在
 * @param path 要检查的文件（夹）路径
 */
export async function exists(path: string, options?: ExistsOptions): FsAsyncResult<boolean> {
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
export function readBlobFile(filePath: string): FsAsyncResult<Blob> {
    return readFile(filePath, {
        encoding: FileEncoding.blob,
    });
}

/**
 * 以字符串格式读取文件
 * @param filePath 要读取的文件路径
 * @returns
 */
export function readTextFile(filePath: string): FsAsyncResult<string> {
    return readFile(filePath, {
        encoding: FileEncoding.utf8,
    });
}