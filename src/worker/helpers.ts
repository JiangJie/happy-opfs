import { TIMEOUT_ERROR } from '../fs/constants.ts';
import type { ErrorLike, FileLike } from '../fs/defines.ts';

/**
 * Serialize an `Error` to plain object.
 * @param error - `Error` object.
 * @returns Serializable version of Error.
 */
export function serializeError(error: Error | null): ErrorLike | null {
    return error ? {
        name: error.name,
        message: error.message,
    } : error;
}

/**
 * Deserialize an `Error` from plain object.
 * @param error - Serializable version of Error.
 * @returns `Error` object.
 */
export function deserializeError(error: ErrorLike): Error {
    const err = new Error(error.message);
    err.name = error.name;

    return err;
}

/**
 * Serialize a `File` to plain object.
 * @param file - `File` object.
 * @returns Serializable version of File.
 */
export async function serializeFile(file: File): Promise<FileLike> {
    const ab = await file.arrayBuffer();
    return {
        name: file.name,
        type: file.type,
        lastModified: file.lastModified,
        size: ab.byteLength,
        data: ab,
    };
}

/**
 * Deserialize a `File` from plain object.
 * @param file - Serializable version of File.
 * @returns `File` object.
 */
export function deserializeFile(file: FileLike): File {
    const blob = new Blob([file.data]);

    return new File([blob], file.name, {
        type: file.type,
        lastModified: file.lastModified,
    });
}

/**
 * Global timeout of per sync I/O operation.
 */
let globalOpTimeout = 1000;

/**
 * Set global timeout of per sync I/O operation.
 * @param timeout - Timeout in milliseconds.
 */
export function setGlobalOpTimeout(timeout: number): void {
    globalOpTimeout = timeout;
}

/**
 * Sleep until a condition is met.
 * @param condition - Condition to be met.
 */
export function sleepUntil(condition: () => boolean) {
    const start = Date.now();
    while (!condition()) {
        if (Date.now() - start > globalOpTimeout) {
            const error = new Error('Operating Timeout');
            error.name = TIMEOUT_ERROR;

            throw error;
        }
    }
}