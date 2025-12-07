/**
 * Tests for shared.ts - encoding/decoding and SyncMessenger
 * These functions can be tested directly in the main thread
 */
import { describe, expect, it } from 'vitest';
import { decodeFromBuffer, decodeToString, encodeToBuffer, SyncMessenger } from '../src/worker/shared.ts';

describe('Shared Module', () => {
    describe('encodeToBuffer', () => {
        it('should encode string to Uint8Array', () => {
            const result = encodeToBuffer('hello');
            expect(result).toBeInstanceOf(Uint8Array);
            expect(result.length).toBeGreaterThan(0);
        });

        it('should encode object to Uint8Array', () => {
            const data = { name: 'test', value: 123 };
            const result = encodeToBuffer(data);
            expect(result).toBeInstanceOf(Uint8Array);
        });

        it('should encode array to Uint8Array', () => {
            const data = [1, 2, 3, 'a', 'b'];
            const result = encodeToBuffer(data);
            expect(result).toBeInstanceOf(Uint8Array);
        });

        it('should encode null to Uint8Array', () => {
            const result = encodeToBuffer(null);
            expect(result).toBeInstanceOf(Uint8Array);
        });

        it('should encode nested object to Uint8Array', () => {
            const data = {
                level1: {
                    level2: {
                        level3: 'deep'
                    }
                }
            };
            const result = encodeToBuffer(data);
            expect(result).toBeInstanceOf(Uint8Array);
        });
    });

    describe('decodeFromBuffer', () => {
        it('should decode Uint8Array back to string', () => {
            const original = 'hello world';
            const encoded = encodeToBuffer(original);
            const decoded = decodeFromBuffer<string>(encoded);
            expect(decoded).toBe(original);
        });

        it('should decode Uint8Array back to object', () => {
            const original = { name: 'test', value: 123 };
            const encoded = encodeToBuffer(original);
            const decoded = decodeFromBuffer<typeof original>(encoded);
            expect(decoded).toEqual(original);
        });

        it('should decode Uint8Array back to array', () => {
            const original = [1, 2, 3, 'a', 'b'];
            const encoded = encodeToBuffer(original);
            const decoded = decodeFromBuffer<typeof original>(encoded);
            expect(decoded).toEqual(original);
        });

        it('should decode Uint8Array back to null', () => {
            const encoded = encodeToBuffer(null);
            const decoded = decodeFromBuffer<null>(encoded);
            expect(decoded).toBeNull();
        });

        it('should handle unicode characters', () => {
            const original = '中文内容 🎉 العربية';
            const encoded = encodeToBuffer(original);
            const decoded = decodeFromBuffer<string>(encoded);
            expect(decoded).toBe(original);
        });
    });

    describe('decodeToString', () => {
        it('should decode Uint8Array to string', () => {
            const text = 'hello world';
            const encoded = new TextEncoder().encode(text);
            const decoded = decodeToString(encoded);
            expect(decoded).toBe(text);
        });

        it('should handle empty Uint8Array', () => {
            const decoded = decodeToString(new Uint8Array(0));
            expect(decoded).toBe('');
        });

        it('should handle unicode in Uint8Array', () => {
            const text = '中文内容';
            const encoded = new TextEncoder().encode(text);
            const decoded = decodeToString(encoded);
            expect(decoded).toBe(text);
        });
    });

    describe('SyncMessenger', () => {
        it('should create messenger with SharedArrayBuffer', () => {
            const sab = new SharedArrayBuffer(1024);
            const messenger = new SyncMessenger(sab);

            expect(messenger.i32a).toBeInstanceOf(Int32Array);
            expect(messenger.u8a).toBeInstanceOf(Uint8Array);
            expect(messenger.headerLength).toBe(16);
            expect(messenger.maxDataLength).toBe(1024 - 16);
        });

        it('should have correct buffer views', () => {
            const bufferSize = 2048;
            const sab = new SharedArrayBuffer(bufferSize);
            const messenger = new SyncMessenger(sab);

            // Int32Array should have bufferSize / 4 elements
            expect(messenger.i32a.length).toBe(bufferSize / 4);
            // Uint8Array should have bufferSize elements
            expect(messenger.u8a.length).toBe(bufferSize);
        });

        it('should calculate maxDataLength correctly', () => {
            const bufferSize = 4096;
            const sab = new SharedArrayBuffer(bufferSize);
            const messenger = new SyncMessenger(sab);

            // maxDataLength = bufferSize - headerLength (16 bytes)
            expect(messenger.maxDataLength).toBe(bufferSize - 16);
        });

        it('should work with minimum buffer size', () => {
            // Minimum size needs to accommodate header (16 bytes) + some data
            const minSize = 32;
            const sab = new SharedArrayBuffer(minSize);
            const messenger = new SyncMessenger(sab);

            expect(messenger.maxDataLength).toBe(16); // 32 - 16
        });
    });

    describe('Round-trip encoding/decoding', () => {
        it('should preserve complex nested structures', () => {
            const original = {
                string: 'hello',
                number: 42,
                float: 3.14,
                boolean: true,
                null: null,
                array: [1, 2, 3],
                nested: {
                    a: { b: { c: 'deep' } }
                }
            };

            const encoded = encodeToBuffer(original);
            const decoded = decodeFromBuffer<typeof original>(encoded);
            expect(decoded).toEqual(original);
        });

        it('should preserve special characters', () => {
            const original = {
                unicode: '日本語テスト',
                emoji: '😀🎉🚀',
                special: '<>&"\'',
                newlines: 'line1\nline2\r\nline3'
            };

            const encoded = encodeToBuffer(original);
            const decoded = decodeFromBuffer<typeof original>(encoded);
            expect(decoded).toEqual(original);
        });

        it('should preserve empty structures', () => {
            const testCases = [
                {},
                [],
                '',
                { empty: {} },
                { emptyArray: [] }
            ];

            for (const original of testCases) {
                const encoded = encodeToBuffer(original);
                const decoded = decodeFromBuffer<typeof original>(encoded);
                expect(decoded).toEqual(original);
            }
        });
    });
});
