import { Lazy } from 'happy-rusty';

/**
 * Lazily initialized `TextEncoder` instance.
 * Created on first access via `force()`.
 */
const encoder = Lazy(() => new TextEncoder());

/**
 * Lazily initialized `TextDecoder` instance.
 * Created on first access via `force()`.
 */
const decoder = Lazy(() => new TextDecoder());

/**
 * Encodes a string to a UTF-8 `Uint8Array`.
 *
 * @param data - The string to encode.
 * @returns A `Uint8Array` containing the encoded data.
 * @internal
 */
export function textEncode(data: string): Uint8Array {
    return encoder.force().encode(data);
}

/**
 * Decodes binary data to a UTF-8 string.
 *
 * @param data - The binary data to decode.
 * @returns The decoded string.
 * @internal
 */
export function textDecode(data: Uint8Array): string {
    return decoder.force().decode(data);
}