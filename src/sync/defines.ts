/**
 * File metadata for binary protocol.
 * Contains all file properties except the binary data.
 *
 * **Why this type exists:**
 * When transferring files via binary protocol, metadata and binary data
 * are separated. Metadata is JSON-serialized while binary data is
 * transferred as the last element for efficiency.
 *
 * @internal
 */
export interface FileMetadata {
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
