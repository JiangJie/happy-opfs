import { Err, Ok, type AsyncIOResult, type Result } from '@happy-js/happy-rusty';
import { basename, dirname } from '@std/path/posix';
import { assertAbsolutePath } from './assertions.ts';
import { NOT_FOUND_ERROR } from './constants.ts';
import type { ReadFileContent, ReadOptions, WriteFileContent, WriteOptions } from './defines.ts';
import { getDirHandle, getFileHandle, isCurrentDir, isRootPath } from './helpers.ts';

/**
 * 递归创建文件夹，相当于`mkdir -p`
 * @param dirPath 要创建的文件夹路径
 */
export async function mkdir(dirPath: string): AsyncIOResult<boolean> {
    assertAbsolutePath(dirPath);

    const dirHandle = await getDirHandle(dirPath, {
        create: true,
    });
    return dirHandle.isOk() ? Ok(true) : dirHandle;
}

/**
 * 读取文件夹一级子内容
 * @param dirPath 文件夹路径
 * @returns
 */
export async function readDir(dirPath: string): AsyncIOResult<AsyncIterableIterator<[string, FileSystemHandle]>> {
    assertAbsolutePath(dirPath);

    const dirHandle = await getDirHandle(dirPath);
    if (dirHandle.isErr()) {
        return dirHandle;
    }

    return Ok(dirHandle.unwrap().entries());
}

/**
 * Returns AsyncIOResult<ArrayBuffer>.
 * @param filePath
 * @param options
 */
export function readFile(filePath: string, options: ReadOptions & {
    encoding: 'binary',
}): AsyncIOResult<ArrayBuffer>;
/**
 * Returns AsyncIOResult<Blob>.
 * @param filePath
 * @param options
 */
export function readFile(filePath: string, options: ReadOptions & {
    encoding: 'blob',
}): AsyncIOResult<Blob>;
/**
 * Returns AsyncIOResult<string>.
 * @param filePath
 * @param options
 */
export function readFile(filePath: string, options: ReadOptions & {
    encoding: 'utf8',
}): AsyncIOResult<string>;
/**
 * Returns AsyncIOResult<ArrayBuffer>.
 * @param filePath
 */
export function readFile(filePath: string): AsyncIOResult<ArrayBuffer>;
/**
 * 读取文件内容，默认返回`ArrayBuffer`
 * @param filePath 文件路径
 * @param options 可按编码返回不同的格式
 * @returns {AsyncIOResult<T>}
 */
export async function readFile<T extends ReadFileContent>(filePath: string, options?: ReadOptions): AsyncIOResult<T> {
    assertAbsolutePath(filePath);

    const fileHandle = await getFileHandle(filePath);
    if (fileHandle.isErr()) {
        // reuse err
        return fileHandle;
    }

    const file = await fileHandle.unwrap().getFile();
    switch (options?.encoding) {
        case 'blob': {
            return Ok(file as unknown as T);
        }
        case 'utf8': {
            const text = await file.text();
            return Ok(text as unknown as T);
        }
        default: {
            const data = await file.arrayBuffer();
            return Ok(data as unknown as T);
        }
    }
}

/**
 * 删除文件或文件夹，相当于`rm -rf`
 * @param path 文件（夹）路径
 * @returns
 */
export async function remove(path: string): AsyncIOResult<boolean> {
    assertAbsolutePath(path);

    const dirPath = dirname(path);
    const childName = basename(path);

    const dirHandle = await getDirHandle(dirPath);
    if (dirHandle.isErr()) {
        return dirHandle;
    }

    // root
    if (isRootPath(dirPath) && isRootPath(childName)) {
        // TODO ts还不支持
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (dirHandle.unwrap() as any).remove({
            recursive: true,
        });
    } else {
        await dirHandle.unwrap().removeEntry(childName, {
            recursive: true,
        });
    }

    return Ok(true);
}

/**
 * 剪切文件或文件夹
 * @param oldPath
 * @param newPath
 * @returns
 */
export async function rename(oldPath: string, newPath: string): AsyncIOResult<boolean> {
    assertAbsolutePath(oldPath);

    const fileHandle = await getFileHandle(oldPath);
    if (fileHandle.isErr()) {
        return fileHandle;
    }

    const dirPath = dirname(oldPath);
    let newDirPath = dirname(newPath);
    // same dir
    if (isCurrentDir(newDirPath)) {
        newDirPath = dirPath;
    } else {
        // not same must be absolute
        assertAbsolutePath(newPath);
    }

    const newDirHandle = await getDirHandle(newDirPath);
    if (newDirHandle.isErr()) {
        return newDirHandle;
    }

    const newName = basename(newPath);
    // TODO ts还不支持
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (fileHandle.unwrap() as any).move(newDirHandle.unwrap(), newName);

    return Ok(true);
}

/**
 * fs.stat
 * @param path
 * @returns
 */
export async function stat(path: string): AsyncIOResult<FileSystemHandle> {
    assertAbsolutePath(path);

    const dirPath = dirname(path);
    const dirHandle = await getDirHandle(dirPath);
    if (dirHandle.isErr()) {
        return dirHandle;
    }

    const childName = basename(path);
    if (!childName) {
        // root
        // reuse
        return dirHandle as unknown as Result<FileSystemHandle, Error>;
    }

    // 当前只有靠遍历检查
    for await (const [name, handle] of dirHandle.unwrap().entries()) {
        if (name === childName) {
            return Ok(handle);
        }
    }

    const err = new Error(`${ path } not found`);
    err.name = NOT_FOUND_ERROR;

    return Err(err);
}

/**
 * 写入文件内容，如果文件不存在默认会创建
 * @param filePath 文件路径
 * @param contents 文件内容
 * @param options
 * @returns
 */
export async function writeFile(filePath: string, contents: WriteFileContent, options?: WriteOptions): AsyncIOResult<boolean> {
    assertAbsolutePath(filePath);

    // 默认创建
    const { append = false, create = true } = options ?? {};

    const fileHandle = await getFileHandle(filePath, {
        create,
    });
    if (fileHandle.isErr()) {
        // reuse err
        return fileHandle;
    }

    const writable = await fileHandle.unwrap().createWritable({
        keepExistingData: append,
    });
    const params: WriteParams = {
        type: 'write',
        data: contents,
    };

    // append?
    if (append) {
        const { size } = await fileHandle.unwrap().getFile();
        params.position = size;
    }

    await writable.write(params);
    await writable.close();

    return Ok(true);
}