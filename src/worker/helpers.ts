import { TIMEOUT_ERROR } from '../fs/constants.ts';
import type { ErrorLike, FileLike } from './defines.ts';

/**
 * Serializes an `Error` object to a plain object for cross-thread communication.
 *
 * @param error - The `Error` object to serialize, or `null`.
 * @returns A serializable `ErrorLike` object, or `null` if input is `null`.
 * @example
 * ```typescript
 * const errorLike = serializeError(new Error('Something went wrong'));
 * // { name: 'Error', message: 'Something went wrong' }
 * ```
 */
export function serializeError(error: Error | null): ErrorLike | null {
    return error ? {
        name: error.name,
        message: error.message,
    } : error;
}

/**
 * Deserializes an `ErrorLike` object back to an `Error` instance.
 *
 * @param error - The `ErrorLike` object to deserialize.
 * @returns An `Error` instance with the same name and message.
 * @example
 * ```typescript
 * const error = deserializeError({ name: 'TypeError', message: 'Invalid type' });
 * console.log(error instanceof Error); // true
 * ```
 */
export function deserializeError(error: ErrorLike): Error {
    const err = new Error(error.message);
    err.name = error.name;

    return err;
}

/**
 * Serializes a `File` object to a plain object for cross-thread communication.
 *
 * @param file - The `File` object to serialize.
 * @returns A promise that resolves to a serializable `FileLike` object.
 * @example
 * ```typescript
 * const fileLike = await serializeFile(file);
 * // { name: 'file.txt', type: 'text/plain', lastModified: 1234567890, size: 100, data: ArrayBuffer }
 * ```
 */
export async function serializeFile(file: File): Promise<FileLike> {
    const ab = await file.arrayBuffer();
    return {
        name: file.name,
        type: file.type,
        lastModified: file.lastModified,
        size: ab.byteLength,
        data: Array.from(new Uint8Array(ab)),
    };
}

/**
 * Deserializes a `FileLike` object back to a `File` instance.
 *
 * @param file - The `FileLike` object to deserialize.
 * @returns A `File` instance with the same properties.
 * @example
 * ```typescript
 * const file = deserializeFile(fileLike);
 * console.log(file instanceof File); // true
 * ```
 */
export function deserializeFile(file: FileLike): File {
    const blob = new Blob([new Uint8Array(file.data)]);

    return new File([blob], file.name, {
        type: file.type,
        lastModified: file.lastModified,
    });
}

/**
 * Global timeout for synchronous I/O operations in milliseconds.
 * @internal
 */
let globalOpTimeout = 1000;

/**
 * Sets the global timeout for synchronous I/O operations.
 *
 * @param timeout - The timeout value in milliseconds.
 * @example
 * ```typescript
 * setGlobalOpTimeout(5000); // Set 5 second timeout
 * ```
 */
export function setGlobalOpTimeout(timeout: number): void {
    globalOpTimeout = timeout;
}

/**
 * Blocks execution until a condition is met or timeout occurs.
 * Uses busy-waiting, which is necessary for synchronous operations.
 *
 * @param condition - A function that returns `true` when the wait should end.
 * @throws {Error} With name `'TimeoutError'` if the condition is not met within the timeout.
 * @internal
 */
export function sleepUntil(condition: () => boolean): void {
    const start = Date.now();
    while (!condition()) {
        if (Date.now() - start > globalOpTimeout) {
            const error = new Error('Operation timed out');
            error.name = TIMEOUT_ERROR;

            throw error;
        }
    }
}