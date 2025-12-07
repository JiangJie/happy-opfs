/**
 * Helpers module tests using Vitest
 * Tests: isRootPath, isNotFoundError, getDirHandle, getFileHandle, createAbortError
 * Also tests worker helpers: serializeError, deserializeError, sleepUntil
 */
import { afterEach, describe, expect, it } from 'vitest';
import { ABORT_ERROR, NOT_FOUND_ERROR, TIMEOUT_ERROR } from '../src/fs/constants.ts';
import { createAbortError, getDirHandle, getFileHandle, isNotFoundError, isRootPath } from '../src/fs/helpers.ts';
import * as fs from '../src/mod.ts';
import { deserializeError, serializeError, setGlobalOpTimeout, sleepUntil } from '../src/worker/helpers.ts';
import { decodeFromBuffer, decodeToString, encodeToBuffer, SyncMessenger } from '../src/worker/shared.ts';

describe('Helpers', () => {
    afterEach(async () => {
        await fs.remove('/helper-test');
        await fs.remove('/helper-dir');
        await fs.remove('/helper-file.txt');
    });

    describe('isRootPath', () => {
        it('should return true for root path', () => {
            expect(isRootPath('/')).toBe(true);
        });

        it('should return false for non-root paths', () => {
            expect(isRootPath('/a')).toBe(false);
            expect(isRootPath('/path/to/file')).toBe(false);
            expect(isRootPath('')).toBe(false);
            expect(isRootPath('//')).toBe(false);
        });
    });

    describe('isNotFoundError', () => {
        it('should return true for NotFoundError', () => {
            const error = new Error('Not found');
            error.name = NOT_FOUND_ERROR;
            expect(isNotFoundError(error)).toBe(true);
        });

        it('should return false for other errors', () => {
            const error = new Error('Some error');
            expect(isNotFoundError(error)).toBe(false);

            const typeError = new TypeError('Type error');
            expect(isNotFoundError(typeError)).toBe(false);
        });
    });

    describe('createAbortError', () => {
        it('should create an error with AbortError name', () => {
            const error = createAbortError();
            expect(error.name).toBe(ABORT_ERROR);
            expect(error.message).toBe('Operation was aborted');
        });
    });

    describe('getDirHandle', () => {
        it('should get root directory handle', async () => {
            const result = await getDirHandle('/');
            expect(result.isOk()).toBe(true);
            const handle = result.unwrap();
            expect(handle.kind).toBe('directory');
        });

        it('should get existing directory handle', async () => {
            await fs.mkdir('/helper-dir');
            const result = await getDirHandle('/helper-dir');
            expect(result.isOk()).toBe(true);
            expect(result.unwrap().name).toBe('helper-dir');
        });

        it('should create directory when create option is true', async () => {
            const result = await getDirHandle('/helper-test/new/dir', { create: true });
            expect(result.isOk()).toBe(true);

            const exists = await fs.exists('/helper-test/new/dir', { isDirectory: true });
            expect(exists.unwrap()).toBe(true);
        });

        it('should fail for non-existent directory without create option', async () => {
            const result = await getDirHandle('/non-existent-dir-xyz');
            expect(result.isErr()).toBe(true);
            expect(isNotFoundError(result.unwrapErr())).toBe(true);
        });

        it('should handle paths with double slashes', async () => {
            await fs.mkdir('/helper-dir');
            const result = await getDirHandle('/helper-dir//');
            expect(result.isOk()).toBe(true);
        });
    });

    describe('getFileHandle', () => {
        it('should get existing file handle', async () => {
            await fs.writeFile('/helper-file.txt', 'test content');
            const result = await getFileHandle('/helper-file.txt');
            expect(result.isOk()).toBe(true);
            expect(result.unwrap().name).toBe('helper-file.txt');
        });

        it('should create file when create option is true', async () => {
            const result = await getFileHandle('/helper-test/new/file.txt', { create: true });
            expect(result.isOk()).toBe(true);

            const exists = await fs.exists('/helper-test/new/file.txt');
            expect(exists.unwrap()).toBe(true);
        });

        it('should fail for non-existent file without create option', async () => {
            const result = await getFileHandle('/non-existent-file-xyz.txt');
            expect(result.isErr()).toBe(true);
        });

        it('should create parent directories when creating file', async () => {
            const result = await getFileHandle('/helper-test/deep/nested/file.txt', { create: true });
            expect(result.isOk()).toBe(true);

            const dirExists = await fs.exists('/helper-test/deep/nested', { isDirectory: true });
            expect(dirExists.unwrap()).toBe(true);
        });
    });

    describe('Worker Helpers', () => {
        describe('serializeError', () => {
            it('should serialize an Error to ErrorLike', () => {
                const error = new Error('Test error message');
                error.name = 'CustomError';
                const serialized = serializeError(error);

                expect(serialized).not.toBeNull();

                const serializedError = serialized as fs.ErrorLike;
                expect(serializedError.name).toBe('CustomError');
                expect(serializedError.message).toBe('Test error message');
            });

            it('should return null for null input', () => {
                const serialized = serializeError(null);
                expect(serialized).toBeNull();
            });
        });

        describe('deserializeError', () => {
            it('should deserialize ErrorLike to Error', () => {
                const errorLike = { name: 'TypeError', message: 'Invalid type' };
                const error = deserializeError(errorLike);

                expect(error instanceof Error).toBe(true);
                expect(error.name).toBe('TypeError');
                expect(error.message).toBe('Invalid type');
            });
        });

        describe('sleepUntil', () => {
            it('should return immediately when condition is true', () => {
                setGlobalOpTimeout(1000);
                // Should not throw
                sleepUntil(() => true);
            });

            it('should throw TimeoutError when condition is never met', () => {
                setGlobalOpTimeout(50); // Short timeout for test
                expect(() => sleepUntil(() => false)).toThrow();
                try {
                    sleepUntil(() => false);
                } catch (e) {
                    expect((e as Error).name).toBe(TIMEOUT_ERROR);
                }
                setGlobalOpTimeout(1000); // Reset timeout
            });

            it('should wait until condition becomes true', () => {
                setGlobalOpTimeout(1000);
                let counter = 0;
                sleepUntil(() => {
                    counter++;
                    return counter > 3;
                });
                expect(counter).toBeGreaterThan(3);
            });
        });
    });

    describe('Shared Utils', () => {
        describe('encodeToBuffer & decodeFromBuffer', () => {
            it('should encode and decode objects', () => {
                const original = { name: 'test', value: 123, nested: { a: 1 } };
                const encoded = encodeToBuffer(original);

                expect(encoded instanceof Uint8Array).toBe(true);

                const decoded = decodeFromBuffer(encoded);
                expect(decoded).toEqual(original);
            });

            it('should encode and decode arrays', () => {
                const original = [1, 2, 'three', { four: 4 }];
                const encoded = encodeToBuffer(original);
                const decoded = decodeFromBuffer(encoded);
                expect(decoded).toEqual(original);
            });

            it('should encode and decode strings', () => {
                const original = 'Hello, World!';
                const encoded = encodeToBuffer(original);
                const decoded = decodeFromBuffer<string>(encoded);
                expect(decoded).toBe(original);
            });
        });

        describe('decodeToString', () => {
            it('should decode Uint8Array to string', () => {
                const text = 'Test string';
                const encoded = new TextEncoder().encode(text);
                const decoded = decodeToString(encoded);
                expect(decoded).toBe(text);
            });
        });

        describe('SyncMessenger', () => {
            it('should create messenger with correct properties', () => {
                const sab = new SharedArrayBuffer(1024);
                const messenger = new SyncMessenger(sab);

                expect(messenger.i32a instanceof Int32Array).toBe(true);
                expect(messenger.u8a instanceof Uint8Array).toBe(true);
                expect(messenger.headerLength).toBe(16);
                expect(messenger.maxDataLength).toBe(1024 - 16);
            });
        });
    });
});
