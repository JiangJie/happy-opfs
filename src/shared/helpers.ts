/**
 * Shared helper utilities for both async and sync APIs.
 *
 * @module
 */

/**
 * Synchronously reads a Blob's content as a Uint8Array.
 * Uses FileReaderSync for synchronous binary data reading.
 *
 * **Note:** This function can only be used in Worker threads,
 * as `FileReaderSync` is not available in the main thread.
 *
 * @param blob - The Blob to read.
 * @returns A Uint8Array containing the blob's binary data.
 * @internal
 */
export function readBlobSync(blob: Blob): Uint8Array<ArrayBuffer> {
    const reader = new FileReaderSync();
    return new Uint8Array(reader.readAsArrayBuffer(blob));
}
