/**
 * Checks if the Origin Private File System (OPFS) is supported in the current environment.
 * OPFS requires a secure context (HTTPS or localhost) and browser support.
 *
 * @returns `true` if OPFS is supported, `false` otherwise.
 * @since 1.0.0
 * @example
 * ```typescript
 * if (isOPFSSupported()) {
 *     // Use OPFS APIs
 *     const result = await readFile('/path/to/file');
 * } else {
 *     console.warn('OPFS is not supported in this environment');
 * }
 * ```
 */
export function isOPFSSupported(): boolean {
    return typeof navigator?.storage?.getDirectory === 'function';
}