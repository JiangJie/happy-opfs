/**
 * Internal shared validation functions for async and sync operations.
 * These functions return Result types instead of throwing exceptions.
 *
 * @internal
 * @module
 */

import { normalize } from '@std/path/posix';
import { Err, Ok, RESULT_VOID, type IOResult, type VoidIOResult } from 'happy-rusty';
import { ROOT_DIR, type ExistsOptions, type WriteFileContent, type WriteSyncFileContent } from '../mod.ts';

/**
 * Validates that the provided path is an absolute path and normalizes it.
 * Returns a Result instead of throwing.
 *
 * @param path - The file path to validate.
 * @returns An `IOResult` containing the normalized absolute path, or an error.
 */
export function validateAbsolutePath(path: string): IOResult<string> {
    if (typeof path !== 'string') {
        return Err(new TypeError(`Path must be a string but received ${ typeof path }`));
    }

    if (path[0] !== ROOT_DIR) {
        return Err(new Error(`Path must be absolute (start with '/'): '${ path }'`));
    }

    // Normalize and remove trailing slash except for root
    const normalized = normalize(path);
    const result = normalized.length > 1 && normalized[normalized.length - 1] === ROOT_DIR
        ? normalized.slice(0, -1)
        : normalized;

    return Ok(result);
}

/**
 * Validates that the provided URL is valid and returns a URL object.
 * Supports relative URLs by using current location as base.
 * Returns a Result instead of throwing.
 *
 * @param url - The URL string or URL object to validate.
 * @returns An `IOResult` containing the URL object, or an error.
 */
export function validateUrl(url: string | URL): IOResult<URL> {
    if (url instanceof URL) {
        return Ok(url);
    }

    try {
        return Ok(new URL(url, location.href));
    } catch {
        return Err(new TypeError(`Invalid URL: '${ url }'`));
    }
}

/**
 * Validates that the provided ExistsOptions are valid.
 * `isDirectory` and `isFile` cannot both be `true`.
 *
 * @param options - The ExistsOptions to validate.
 * @returns A `VoidIOResult` indicating success, or an error if options are invalid.
 */
export function validateExistsOptions(options?: ExistsOptions): VoidIOResult {
    const { isDirectory = false, isFile = false } = options ?? {};

    return isDirectory && isFile
        ? Err(new Error('isDirectory and isFile cannot both be true'))
        : RESULT_VOID;
}

/**
 * Validates that the provided value is a valid Date for pruneTemp expiration.
 * Returns a Result instead of throwing.
 *
 * @param expired - The Date to validate.
 * @returns A `VoidIOResult` indicating success, or an error if not a valid Date instance, eg: `new Date('invalid')`.
 */
export function validateExpiredDate(expired: Date): VoidIOResult {
    if (!(expired instanceof Date)) {
        return Err(new TypeError(`Expired must be a Date but received ${ typeof expired }`));
    }

    return Number.isNaN(expired.getTime())
        ? Err(new TypeError('Expired must be a valid Date'))
        : RESULT_VOID;
}

/**
 * Validates that the provided content is a valid type for writeFile (async).
 * Supports: string, Blob, ArrayBuffer, TypedArray, ReadableStream<Uint8Array>.
 *
 * @param contents - The content to validate.
 * @returns A `VoidIOResult` indicating success, or an error if type is invalid.
 */
export function validateWriteFileContent(contents: WriteFileContent): VoidIOResult {
    // Check for ReadableStream first (async only)
    if (isBinaryReadableStream(contents)) {
        return RESULT_VOID;
    }

    // Check for Blob (async only)
    if (contents instanceof Blob) {
        return RESULT_VOID;
    }

    // Check for sync-compatible types (string, ArrayBuffer, TypedArray)
    if (isWriteSyncFileContent(contents)) {
        return RESULT_VOID;
    }

    return Err(new TypeError('Invalid content type for writeFile. Expected string, Blob, ArrayBuffer, TypedArray, or ReadableStream'));
}

/**
 * Validates that the provided content is a valid type for writeFileSync (sync).
 * Supports: string, ArrayBuffer, TypedArray.
 * Note: Blob and ReadableStream are NOT supported in sync operations.
 *
 * @param contents - The content to validate.
 * @returns A `VoidIOResult` indicating success, or an error if type is invalid.
 */
export function validateWriteSyncFileContent(contents: WriteSyncFileContent): VoidIOResult {
    if (!isWriteSyncFileContent(contents)) {
        return Err(new TypeError('Invalid content type for writeFileSync. Expected string, ArrayBuffer, or TypedArray'));
    }

    return RESULT_VOID;
}

// #region Internal functions

/**
 * Type guard for detecting binary ReadableStream input for file writing.
 *
 * @param x - The value to check.
 * @returns `true` if the value is a ReadableStream.
 */
function isBinaryReadableStream(x: unknown): x is ReadableStream<Uint8Array<ArrayBuffer>> {
    return typeof ReadableStream !== 'undefined' && x instanceof ReadableStream;
}

/**
 * Type guard for detecting valid sync file content types.
 * Supports: string, ArrayBuffer, ArrayBufferView (TypedArray/DataView).
 *
 * @param contents - The value to check.
 * @returns `true` if the value is a valid sync file content type.
 */
function isWriteSyncFileContent(contents: unknown): contents is WriteSyncFileContent {
    return typeof contents === 'string' ||
        contents instanceof ArrayBuffer ||
        ArrayBuffer.isView(contents);
}

// #endregion
