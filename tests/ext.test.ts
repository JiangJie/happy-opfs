/**
 * Extended OPFS operations tests using Vitest
 * Tests: appendFile, copy, move, emptyDir, exists, readBlobFile, readJsonFile, writeJsonFile
 */
import { afterEach, describe, expect, it } from 'vitest';
import * as fs from '../src/mod.ts';

describe('OPFS Extended Operations', () => {
    afterEach(async () => {
        // Clean up test files
        await fs.remove('/test-append.txt');
        await fs.remove('/test-append-new.txt');
        await fs.remove('/test-append-bin.bin');
        await fs.remove('/copy-src.txt');
        await fs.remove('/copy-dest.txt');
        await fs.remove('/copy-dir-src');
        await fs.remove('/copy-dir-dest');
        await fs.remove('/copy-overwrite-src.txt');
        await fs.remove('/copy-overwrite-dest.txt');
        await fs.remove('/copy-no-overwrite-src.txt');
        await fs.remove('/copy-no-overwrite-dest.txt');
        await fs.remove('/copy-type-mismatch.txt');
        await fs.remove('/copy-type-mismatch-dir');
        await fs.remove('/move-src.txt');
        await fs.remove('/move-dest.txt');
        await fs.remove('/move-dir-src');
        await fs.remove('/move-dir-dest');
        await fs.remove('/move-overwrite-src.txt');
        await fs.remove('/move-overwrite-dest.txt');
        await fs.remove('/empty-dir-test');
        await fs.remove('/new-empty-dir');
        await fs.remove('/exists-test.txt');
        await fs.remove('/exists-dir-test');
        await fs.remove('/exists-isfile.txt');
        await fs.remove('/exists-isfile-dir');
        await fs.remove('/exists-isdir.txt');
        await fs.remove('/exists-isdir-dir');
        await fs.remove('/blob-test.txt');
        await fs.remove('/json-test.json');
        await fs.remove('/json-array.json');
        await fs.remove('/invalid.json');
        await fs.remove('/circular.json');
        await fs.remove('/copy-dest-error-src');
        await fs.remove('/copy-dest-error-dest.txt');
        await fs.remove('/copy-dir-exists-src');
        await fs.remove('/copy-dir-exists-dest');
        await fs.remove('/copy-exists-error-src');
        await fs.remove('/copy-exists-error-dest');
        await fs.remove('/copy-self-src');
        await fs.remove('/copy-same.txt');
        await fs.remove('/copy-root-dest');
        await fs.remove('/copy-empty-src');
        await fs.remove('/copy-empty-dest');
        await fs.remove('/copy-empty-subs-src');
        await fs.remove('/copy-empty-subs-dest');
    });

    describe('appendFile', () => {
        it('should append content to existing file', async () => {
            await fs.writeFile('/test-append.txt', 'Hello');
            await fs.appendFile('/test-append.txt', ' World');

            const content = await fs.readTextFile('/test-append.txt');
            expect(content.unwrap()).toBe('Hello World');
        });

        it('should create file if not exists', async () => {
            await fs.appendFile('/test-append-new.txt', 'New content');

            const content = await fs.readTextFile('/test-append-new.txt');
            expect(content.unwrap()).toBe('New content');
        });

        it('should append binary content', async () => {
            await fs.writeFile('/test-append-bin.bin', new Uint8Array([1, 2, 3]));
            await fs.appendFile('/test-append-bin.bin', new Uint8Array([4, 5, 6]));

            const result = await fs.readFile('/test-append-bin.bin');
            const buffer = result.unwrap();
            expect(buffer.byteLength).toBe(6);
        });
    });

    describe('copy', () => {
        it('should copy a file', async () => {
            await fs.writeFile('/copy-src.txt', 'Copy me');
            const result = await fs.copy('/copy-src.txt', '/copy-dest.txt');
            expect(result.isOk()).toBe(true);

            // Both files should exist
            expect((await fs.exists('/copy-src.txt')).unwrap()).toBe(true);
            expect((await fs.exists('/copy-dest.txt')).unwrap()).toBe(true);

            // Content should be the same
            const content = await fs.readTextFile('/copy-dest.txt');
            expect(content.unwrap()).toBe('Copy me');
        });

        it('should copy a directory', async () => {
            await fs.mkdir('/copy-dir-src/sub');
            await fs.writeFile('/copy-dir-src/file.txt', 'root');
            await fs.writeFile('/copy-dir-src/sub/file.txt', 'sub');

            const result = await fs.copy('/copy-dir-src', '/copy-dir-dest');
            expect(result.isOk()).toBe(true);

            // Verify copied structure
            expect((await fs.exists('/copy-dir-dest/file.txt')).unwrap()).toBe(true);
            expect((await fs.exists('/copy-dir-dest/sub/file.txt')).unwrap()).toBe(true);
        });

        it('should overwrite by default', async () => {
            await fs.writeFile('/copy-overwrite-src.txt', 'New content');
            await fs.writeFile('/copy-overwrite-dest.txt', 'Old content');

            await fs.copy('/copy-overwrite-src.txt', '/copy-overwrite-dest.txt');

            const content = await fs.readTextFile('/copy-overwrite-dest.txt');
            expect(content.unwrap()).toBe('New content');
        });

        it('should not overwrite when overwrite is false', async () => {
            await fs.writeFile('/copy-no-overwrite-src.txt', 'New content');
            await fs.writeFile('/copy-no-overwrite-dest.txt', 'Old content');

            await fs.copy('/copy-no-overwrite-src.txt', '/copy-no-overwrite-dest.txt', { overwrite: false });

            const content = await fs.readTextFile('/copy-no-overwrite-dest.txt');
            expect(content.unwrap()).toBe('Old content');
        });

        it('should fail when src and dest are different types', async () => {
            await fs.writeFile('/copy-type-mismatch.txt', 'file');
            await fs.mkdir('/copy-type-mismatch-dir');

            const result = await fs.copy('/copy-type-mismatch.txt', '/copy-type-mismatch-dir');
            expect(result.isErr()).toBe(true);
        });
    });

    describe('move', () => {
        it('should move a file', async () => {
            await fs.writeFile('/move-src.txt', 'Move me');
            const result = await fs.move('/move-src.txt', '/move-dest.txt');
            expect(result.isOk()).toBe(true);

            // Source should not exist
            expect((await fs.exists('/move-src.txt')).unwrap()).toBe(false);
            // Destination should exist
            expect((await fs.exists('/move-dest.txt')).unwrap()).toBe(true);

            const content = await fs.readTextFile('/move-dest.txt');
            expect(content.unwrap()).toBe('Move me');
        });

        it('should move a directory', async () => {
            await fs.mkdir('/move-dir-src/sub');
            await fs.writeFile('/move-dir-src/file.txt', 'root');

            const result = await fs.move('/move-dir-src', '/move-dir-dest');
            expect(result.isOk()).toBe(true);

            expect((await fs.exists('/move-dir-src')).unwrap()).toBe(false);
            expect((await fs.exists('/move-dir-dest/file.txt')).unwrap()).toBe(true);
        });

        it('should overwrite by default', async () => {
            await fs.writeFile('/move-overwrite-src.txt', 'New');
            await fs.writeFile('/move-overwrite-dest.txt', 'Old');

            await fs.move('/move-overwrite-src.txt', '/move-overwrite-dest.txt');

            const content = await fs.readTextFile('/move-overwrite-dest.txt');
            expect(content.unwrap()).toBe('New');
        });
    });

    describe('emptyDir', () => {
        it('should empty an existing directory', async () => {
            await fs.mkdir('/empty-dir-test');
            await fs.writeFile('/empty-dir-test/file1.txt', 'a');
            await fs.writeFile('/empty-dir-test/file2.txt', 'b');
            await fs.mkdir('/empty-dir-test/sub');

            const result = await fs.emptyDir('/empty-dir-test');
            expect(result.isOk()).toBe(true);

            // Directory should exist but be empty
            expect((await fs.exists('/empty-dir-test', { isDirectory: true })).unwrap()).toBe(true);
            const entries = await Array.fromAsync((await fs.readDir('/empty-dir-test')).unwrap());
            expect(entries.length).toBe(0);
        });

        it('should create directory if not exists', async () => {
            const result = await fs.emptyDir('/new-empty-dir');
            expect(result.isOk()).toBe(true);

            expect((await fs.exists('/new-empty-dir', { isDirectory: true })).unwrap()).toBe(true);
        });

        it('should fail if path is a file', async () => {
            await fs.writeFile('/empty-dir-test', 'I am a file');

            const result = await fs.emptyDir('/empty-dir-test');
            expect(result.isErr()).toBe(true);
            expect(result.unwrapErr().message).toContain('not a directory');
        });

        it('should return error for non-NotFoundError on stat', async () => {
            // Create a file to act as parent
            await fs.writeFile('/empty-dir-test', 'file');

            // Try to empty a path whose parent is a file (TypeMismatchError)
            const result = await fs.emptyDir('/empty-dir-test/child');
            expect(result.isErr()).toBe(true);
        });

        // Note: Testing emptyDir('/') is skipped because it would affect other tests
        // running in parallel. The code path is covered by isRootDir check in isRootDir check
        // which delegates to remove('/'), tested in core.test.ts
    });

    describe('readBlobFile', () => {
        it('should read file as File object', async () => {
            await fs.writeFile('/blob-test.txt', 'Blob content');

            const result = await fs.readBlobFile('/blob-test.txt');
            const file = result.unwrap();

            expect(file instanceof File).toBe(true);
            expect(file.name).toBe('blob-test.txt');
            expect(file.size).toBe(12);
        });
    });

    describe('readJsonFile & writeJsonFile', () => {
        it('should write and read JSON object', async () => {
            const data = { name: 'test', value: 123, nested: { a: 1 } };

            const writeResult = await fs.writeJsonFile('/json-test.json', data);
            expect(writeResult.isOk()).toBe(true);

            const readResult = await fs.readJsonFile<typeof data>('/json-test.json');
            const parsed = readResult.unwrap();
            expect(parsed).toEqual(data);
        });

        it('should write and read JSON array', async () => {
            const data = [1, 2, 3, { a: 'b' }];

            await fs.writeJsonFile('/json-array.json', data);

            const result = await fs.readJsonFile<typeof data>('/json-array.json');
            expect(result.unwrap()).toEqual(data);
        });

        it('should fail to read invalid JSON', async () => {
            await fs.writeFile('/invalid.json', 'not valid json');

            const result = await fs.readJsonFile('/invalid.json');
            expect(result.isErr()).toBe(true);
        });

        it('should fail to write circular reference JSON', async () => {
            // Create circular reference that JSON.stringify cannot handle
            const circular: Record<string, unknown> = { name: 'test' };
            circular['self'] = circular;

            const result = await fs.writeJsonFile('/circular.json', circular);
            expect(result.isErr()).toBe(true);
            expect(result.unwrapErr().message).toContain('circular');
        });
    });

    describe('copy/move edge cases', () => {
        it('should fail copy when dest path parent is a file (non-NotFoundError)', async () => {
            // Create source directory
            await fs.mkdir('/copy-dest-error-src');
            await fs.writeFile('/copy-dest-error-src/file.txt', 'content');

            // Create a file where we expect a directory for dest path
            await fs.writeFile('/copy-dest-error-dest.txt', 'I am a file');

            // Try to copy to a path where parent is a file - this should fail with TypeMismatchError
            // stat('/copy-dest-error-dest.txt/child') will fail because parent is a file
            const result = await fs.copy('/copy-dest-error-src', '/copy-dest-error-dest.txt/child');
            expect(result.isErr()).toBe(true);
        });

        it('should copy directory when destination already exists', async () => {
            // Create source directory with files
            await fs.mkdir('/copy-dir-exists-src/sub');
            await fs.writeFile('/copy-dir-exists-src/file1.txt', 'source1');
            await fs.writeFile('/copy-dir-exists-src/sub/file2.txt', 'source2');

            // Create destination directory with some existing content
            await fs.mkdir('/copy-dir-exists-dest');
            await fs.writeFile('/copy-dir-exists-dest/existing.txt', 'existing');

            // Copy to existing directory - this exercises the destExists=true branch (lines 92-100)
            const result = await fs.copy('/copy-dir-exists-src', '/copy-dir-exists-dest');
            expect(result.isOk()).toBe(true);

            // Verify both new and existing files are present
            expect((await fs.exists('/copy-dir-exists-dest/file1.txt')).unwrap()).toBe(true);
            expect((await fs.exists('/copy-dir-exists-dest/sub/file2.txt')).unwrap()).toBe(true);
            // Note: existing.txt is in dest but not in src, so it's not affected
        });

        it('should copy directory to existing dest with overwrite false', async () => {
            // Create source directory
            await fs.mkdir('/copy-dir-exists-src');
            await fs.writeFile('/copy-dir-exists-src/file.txt', 'new content');

            // Create destination with same file
            await fs.mkdir('/copy-dir-exists-dest');
            await fs.writeFile('/copy-dir-exists-dest/file.txt', 'old content');

            // Copy with overwrite=false - exercises the overwrite check in lines 102-103
            const result = await fs.copy('/copy-dir-exists-src', '/copy-dir-exists-dest', { overwrite: false });
            expect(result.isOk()).toBe(true);

            // Content should not be overwritten
            const content = await fs.readTextFile('/copy-dir-exists-dest/file.txt');
            expect(content.unwrap()).toBe('old content');
        });

        it('should fail copy directory when exists check fails ', async () => {
            // Create source directory with nested structure
            await fs.mkdir('/copy-exists-error-src/sub');
            await fs.writeFile('/copy-exists-error-src/sub/file.txt', 'content');

            // Create destination directory where 'sub' is a file instead of directory
            // This causes exists('/copy-exists-error-dest/sub/file.txt') to fail with TypeMismatchError
            // because 'sub' is a file, not a directory
            await fs.mkdir('/copy-exists-error-dest');
            await fs.writeFile('/copy-exists-error-dest/sub', 'I am a file not a directory');

            // Copy directory - destExists=true, and checking exists of 'sub/file.txt' will fail
            const result = await fs.copy('/copy-exists-error-src', '/copy-exists-error-dest');
            expect(result.isErr()).toBe(true);
        });

        it('should fail when copying directory into itself', async () => {
            await fs.mkdir('/copy-self-src/sub');
            await fs.writeFile('/copy-self-src/file.txt', 'content');

            // Try to copy directory into itself
            const result = await fs.copy('/copy-self-src', '/copy-self-src/sub/dest');
            expect(result.isErr()).toBe(true);
            expect(result.unwrapErr().message).toContain('into itself');
        });

        it('should fail when copying to same path', async () => {
            await fs.writeFile('/copy-same.txt', 'content');

            const result = await fs.copy('/copy-same.txt', '/copy-same.txt');
            expect(result.isErr()).toBe(true);
            expect(result.unwrapErr().message).toContain('into itself');
        });

        it('should fail when copying root directory', async () => {
            await fs.mkdir('/copy-root-dest');

            const result = await fs.copy('/', '/copy-root-dest');
            expect(result.isErr()).toBe(true);
            expect(result.unwrapErr().message).toContain('into itself');
        });

        it('should copy empty directory', async () => {
            await fs.mkdir('/copy-empty-src');

            const result = await fs.copy('/copy-empty-src', '/copy-empty-dest');
            expect(result.isOk()).toBe(true);

            expect((await fs.exists('/copy-empty-dest', { isDirectory: true })).unwrap()).toBe(true);
        });

        it('should copy directory with only empty subdirectories', async () => {
            await fs.mkdir('/copy-empty-subs-src/empty1');
            await fs.mkdir('/copy-empty-subs-src/empty2');

            const result = await fs.copy('/copy-empty-subs-src', '/copy-empty-subs-dest');
            expect(result.isOk()).toBe(true);

            expect((await fs.exists('/copy-empty-subs-dest/empty1', { isDirectory: true })).unwrap()).toBe(true);
            expect((await fs.exists('/copy-empty-subs-dest/empty2', { isDirectory: true })).unwrap()).toBe(true);
        });

        it('should fail when source does not exist', async () => {
            const result = await fs.copy('/non-existent-src', '/copy-dest');
            expect(result.isErr()).toBe(true);
        });

        it('should fail move when source does not exist', async () => {
            const result = await fs.move('/non-existent-src', '/move-dest');
            expect(result.isErr()).toBe(true);
        });
    });

    describe('Argument validation errors', () => {
        it('should fail exists with invalid options', async () => {
            // Actually validateExistsOptions checks if both isFile and isDirectory are true
            // @ts-expect-error but we want to test the error case
            const result = await fs.exists('/some/path', { isFile: true, isDirectory: true });
            expect(result.isErr()).toBe(true);
        });

        it('should fail copy with invalid source path', async () => {
            const result = await fs.copy('relative/path', '/dest');
            expect(result.isErr()).toBe(true);
            expect(result.unwrapErr().message).toContain('absolute');
        });

        it('should fail copy with invalid dest path', async () => {
            // Setup source so validation passes
            await fs.writeFile('/valid-src', 'content');
            const result = await fs.copy('/valid-src', 'relative/dest');
            expect(result.isErr()).toBe(true);
            expect(result.unwrapErr().message).toContain('absolute');
            await fs.remove('/valid-src');
        });

        it('should fail move with invalid source path', async () => {
            const result = await fs.move('relative/path', '/dest');
            expect(result.isErr()).toBe(true);
            expect(result.unwrapErr().message).toContain('absolute');
        });

        it('should fail move with invalid dest path', async () => {
            await fs.writeFile('/valid-move-src', 'content');
            const result = await fs.move('/valid-move-src', 'relative/dest');
            expect(result.isErr()).toBe(true);
            expect(result.unwrapErr().message).toContain('absolute');
            await fs.remove('/valid-move-src');
        });

        it('should fail emptyDir with invalid path', async () => {
            const result = await fs.emptyDir('relative/path');
            expect(result.isErr()).toBe(true);
            expect(result.unwrapErr().message).toContain('absolute');
        });

        it('should fail readBlobFile with invalid path', async () => {
            const result = await fs.readBlobFile('relative/path');
            expect(result.isErr()).toBe(true);
            expect(result.unwrapErr().message).toContain('absolute');
        });

        it('should fail readJsonFile with invalid path', async () => {
            const result = await fs.readJsonFile('relative/path');
            expect(result.isErr()).toBe(true);
            expect(result.unwrapErr().message).toContain('absolute');
        });

        it('should fail writeJsonFile with invalid path', async () => {
            const result = await fs.writeJsonFile('relative/path', { data: 'test' });
            expect(result.isErr()).toBe(true);
            expect(result.unwrapErr().message).toContain('absolute');
        });
    });
});
