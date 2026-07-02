import { Err, type AsyncVoidIOResult } from 'happy-rusty';
import { validateAbsolutePath } from '../../shared/internal/mod.ts';
import { getFileHandle } from '../internal/mod.ts';

/**
 * Truncates (resizes) a file to the specified size.
 *
 * If `len` is smaller than the current file size, the file is shortened and
 * the trailing data is discarded. If `len` is larger, the file is extended
 * with zero bytes (`\x00`).
 *
 * The file must already exist; this operation never creates a new file.
 * Truncating a directory path returns a `TypeMismatchError`.
 *
 * @param filePath - The absolute path of the file to truncate.
 * @param len - The target size in bytes. Must be a non-negative integer.
 * @returns A promise that resolves to an `AsyncVoidIOResult` indicating success or failure.
 * @since 2.2.0
 * @see {@link truncateSync} for synchronous version
 * @example
 * ```typescript
 * await writeFile('/log.txt', 'Hello, World!');
 * await truncate('/log.txt', 5);   // file now contains "Hello"
 * await truncate('/log.txt', 8);   // file now contains "Hello\x00\x00\x00"
 * ```
 */
export async function truncate(filePath: string, len: number): AsyncVoidIOResult {
    const filePathRes = validateAbsolutePath(filePath);
    if (filePathRes.isErr()) return filePathRes.asErr();
    filePath = filePathRes.unwrap();

    if (!Number.isInteger(len) || len < 0) {
        return Err(new TypeError(`Size must be a non-negative integer, got ${ len }`));
    }

    const fileHandleRes = await getFileHandle(filePath, { create: false });
    return fileHandleRes.andTryAsync(async fileHandle => {
        // Prefer sync access handle in Worker for better performance
        if (typeof fileHandle.createSyncAccessHandle === 'function') {
            const accessHandle = await fileHandle.createSyncAccessHandle();
            try {
                accessHandle.truncate(len);
            } finally {
                accessHandle.close();
            }
            return;
        }

        // Main thread fallback: keep existing data, then resize
        const writable = await fileHandle.createWritable({ keepExistingData: true });
        try {
            await writable.truncate(len);
        } finally {
            await writable.close();
        }
    });
}
