/**
 * Helpers module tests using Vitest
 * Tests: isRootPath, isNotFoundError, getDirHandle, getFileHandle, createAbortError
 */
import { afterEach, describe, expect, it } from 'vitest';
import * as fs from '../src/mod.ts';
import { isRootPath, isNotFoundError, getDirHandle, getFileHandle, createAbortError } from '../src/fs/helpers.ts';
import { NOT_FOUND_ERROR, ABORT_ERROR } from '../src/fs/constants.ts';

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
});
