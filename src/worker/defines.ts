/**
 * Serializable version of `File`.
 *
 * Unlike the native `File` object which contains a `Blob` with binary data,
 * this interface stores the file content as a `number[]` array for JSON serialization.
 *
 * **Why this type exists:**
 * Native `File` objects cannot be directly serialized to JSON because they contain
 * binary `Blob` data. When transferring file content between the main thread and
 * Web Worker via `SharedArrayBuffer`, we need a plain object representation.
 *
 * **When it's used:**
 * - Internally used when worker reads a file and sends it back to main thread
 * - The `data` property is converted from `ArrayBuffer` to `number[]` for JSON encoding
 * - Deserialized back to `File` via `deserializeFile()` on the main thread
 *
 * @see {@link File} - The native browser File API
 * @internal
 */
export interface FileLike {
    /**
     * The name of the file.
     */
    readonly name: string;

    /**
     * The MIME type of the file.
     */
    readonly type: string;

    /**
     * The last modified timestamp in milliseconds since Unix epoch.
     */
    readonly lastModified: number;

    /**
     * The size of the file in bytes.
     */
    readonly size: number;

    /**
     * The binary data of the file as a number array.
     * Each number represents a byte (0-255).
     * Converted from `ArrayBuffer` for JSON serialization.
     */
    readonly data: number[];
}

/**
 * Serializable version of `Error`.
 *
 * Contains only the essential error properties that can be serialized to JSON.
 *
 * **Why this type exists:**
 * Native `Error` objects have non-enumerable properties and a prototype chain
 * that cannot be properly serialized/deserialized via JSON. This type captures
 * only the `name` and `message` properties needed to reconstruct an error.
 *
 * **When it's used:**
 * - Internally used when worker encounters an error and sends it back to main thread
 * - Serialized via `serializeError()` in worker, deserialized via `deserializeError()` in main
 * - Allows sync API to return proper `Err(error)` results
 *
 * @see {@link Error} - The native JavaScript Error
 * @internal
 */
export interface ErrorLike {
    /**
     * The name of the error (e.g., 'Error', 'TypeError', 'NotFoundError').
     */
    name: string;

    /**
     * The error message describing what went wrong.
     */
    message: string;
}
