import { Ok, type Result } from '@happy-js/happy-rusty';
import { NOT_FOUND_ERROR } from './constants.ts';
import { FileEncoding, type ExistsOptions, type WriteFileContent } from './defines.ts';
import { readFile as readFileContent, stat, writeFile } from './opfs_core.ts';

/**
 * 将内容写入文件末尾
 * @param filePath 要写入的文件路径
 * @param contents 写入内容
 * @returns
 */
export function appendFile(filePath: string, contents: WriteFileContent): Promise<Result<boolean, Error>> {
    return writeFile(filePath, contents, {
        append: true,
    });
}

/**
 * 检查路径是否存在
 * @param path 要检查的文件（夹）路径
 */
export async function exists(path: string, options?: ExistsOptions): Promise<Result<boolean, Error>> {
    const status = await stat(path);
    if (status.isErr()) {
        if (status.err().name === NOT_FOUND_ERROR) {
            return Ok(false);
        }
        // reuse
        return status as Result<boolean, Error>;
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
 * 以二进制格式读取文件
 * @param filePath 要读取的文件路径
 * @returns
 */
export async function readFile(filePath: string): Promise<Result<ArrayBuffer, Error>> {
    return readFileContent(filePath) as Promise<Result<ArrayBuffer, Error>>;
}

/**
 * 以Blob格式读取文件
 * @param filePath 要读取的文件路径
 * @returns
 */
export function readBlobFile(filePath: string): Promise<Result<Blob, Error>> {
    return readFileContent(filePath, {
        encoding: FileEncoding.blob,
    }) as Promise<Result<Blob, Error>>;
}

/**
 * 以字符串格式读取文件
 * @param filePath 要读取的文件路径
 * @returns
 */
export function readTextFile(filePath: string): Promise<Result<string, Error>> {
    return readFileContent(filePath, {
        encoding: FileEncoding.utf8,
    }) as Promise<Result<string, Error>>;
}