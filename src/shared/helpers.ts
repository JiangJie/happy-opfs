/**
 * Shared helper utilities for both async and sync APIs.
 *
 * @internal
 * @module
 */

/**
 * Asynchronously reads a Blob's content as a Uint8Array.
 * Uses native `bytes()` method if available, otherwise falls back to `arrayBuffer()`.
 *
 * @param blob - The Blob to read.
 * @returns A promise that resolves to a Uint8Array containing the blob's binary data.
 */
export async function readBlobBytes(blob: Blob): Promise<Uint8Array<ArrayBuffer>> {
    return typeof blob.bytes === 'function'
        ? blob.bytes()
        : new Uint8Array(await blob.arrayBuffer());
}

/**
 * Synchronously reads a Blob's content as a Uint8Array.
 * Uses FileReaderSync for synchronous binary data reading.
 *
 * **Note:** This function can only be used in Worker threads,
 * as `FileReaderSync` is not available in the main thread.
 *
 * @param blob - The Blob to read.
 * @returns A Uint8Array containing the blob's binary data.
 */
export function readBlobBytesSync(blob: Blob): Uint8Array<ArrayBuffer> {
    const reader = new FileReaderSync();
    return new Uint8Array(reader.readAsArrayBuffer(blob));
}
