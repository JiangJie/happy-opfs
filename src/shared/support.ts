/**
 * Checks if the Origin Private File System (OPFS) is supported in the current environment.
 * OPFS requires a secure context (HTTPS or localhost) and browser support.
 *
 * @returns `true` if OPFS is supported, `false` otherwise.
 * @since 1.0.0
 * @see {@link isSyncChannelSupported} for checking sync channel support
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

/**
 * Checks if the SyncChannel (synchronous file system operations) is supported.
 * SyncChannel requires `SharedArrayBuffer` and `Atomics` which are only available
 * in secure contexts with proper COOP/COEP headers.
 *
 * **Required HTTP headers for cross-origin isolation:**
 * ```
 * Cross-Origin-Opener-Policy: same-origin
 * Cross-Origin-Embedder-Policy: require-corp
 * ```
 *
 * @returns `true` if SyncChannel is supported, `false` otherwise.
 * @since 2.0.0
 * @see {@link isOPFSSupported} for checking OPFS support
 * @example
 * ```typescript
 * if (isSyncChannelSupported()) {
 *     // Use sync APIs
 *     const result = await SyncChannel.connect(worker);
 *     const content = readFileSync('/path/to/file');
 * } else {
 *     console.warn('SyncChannel requires cross-origin isolation');
 * }
 * ```
 */
export function isSyncChannelSupported(): boolean {
    return typeof SharedArrayBuffer === 'function' && typeof Atomics === 'object';
}