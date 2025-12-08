/**
 * Cache the `TextEncoder` instance.
 */
let encoder: TextEncoder;

/**
 * Cache the `TextDecoder` instance.
 */
let decoder: TextDecoder;

/**
 * Get the cached `TextEncoder` instance.
 * @returns Instance of `TextEncoder`.
 */
function getEncoder(): TextEncoder {
    encoder ??= new TextEncoder();
    return encoder;
}

/**
 * Get the cached `TextDecoder` instance.
 * @returns Instance of `TextDecoder`.
 */
function getDecoder(): TextDecoder {
    decoder ??= new TextDecoder();
    return decoder;
}

/**
 * Encodes a string to a UTF-8 `Uint8Array`.
 *
 * @param data - The string to encode.
 * @returns A `Uint8Array` containing the encoded data.
 */
export function textEncode(data: string): Uint8Array {
    return getEncoder().encode(data);
}

/**
 * Decodes binary data to a UTF-8 string.
 *
 * @param data - The binary data to decode.
 * @returns The decoded string.
 */
export function textDecode(data: Uint8Array): string {
    return getDecoder().decode(data);
}