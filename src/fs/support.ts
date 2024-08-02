/**
 * Checks if the Origin Private File System (OPFS) is supported in the current environment.
 *
 * @returns A boolean indicating whether OPFS is supported.
 */
export function isOPFSSupported(): boolean {
    return typeof navigator?.storage?.getDirectory === 'function';
}