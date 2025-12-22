/**
 * Checks if a string is a valid URL.
 *
 * @param url - The URL string to validate.
 * @returns Whether the URL is valid.
 * @internal
 */
export function isValidUrl(url: string): boolean {
    if (typeof URL.canParse === 'function') {
        return URL.canParse(url);
    }
    // Fallback for older browsers
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}

/**
 * Extracts the pathname from a URL.
 *
 * @param url - The URL to extract pathname from.
 * @returns The pathname of the URL.
 * @internal
 */
export function getUrlPathname(url: string | URL): string {
    return url instanceof URL
        ? url.pathname
        : new URL(url).pathname;
}
