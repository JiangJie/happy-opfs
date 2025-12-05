/**
 * Core OPFS operations tests using Vitest
 * Tests: createFile, mkdir, readDir, readFile, writeFile, remove, stat
 */
import { afterEach, describe, expect, it } from 'vitest';
import * as fs from '../src/mod.ts';

describe('OPFS Core Operations', () => {
    // Clean up test files after each test
    afterEach(async () => {
        await fs.remove('/test-file.txt');
        await fs.remove('/test-dir');
        await fs.remove('/nested');
        await fs.remove('/existing-file.txt');
        await fs.remove('/existing-dir');
        await fs.remove('/test-readdir');
        await fs.remove('/test-readdir-recursive');
        await fs.remove('/test-stat-file.txt');
        await fs.remove('/test-stat-dir');
    });

    describe('createFile', () => {
        it('should create a new empty file', async () => {
            const result = await fs.createFile('/test-file.txt');
            expect(result.isOk()).toBe(true);

            const exists = await fs.exists('/test-file.txt');
            expect(exists.isOk()).toBe(true);
            expect(exists.unwrap()).toBe(true);
        });

        it('should create file with nested directories', async () => {
            const result = await fs.createFile('/nested/dir/file.txt');
            expect(result.isOk()).toBe(true);

            const exists = await fs.exists('/nested/dir/file.txt');
            expect(exists.isOk()).toBe(true);
            expect(exists.unwrap()).toBe(true);
        });

        it('should succeed if file already exists', async () => {
            await fs.writeFile('/existing-file.txt', 'content');
            const result = await fs.createFile('/existing-file.txt');
            expect(result.isOk()).toBe(true);

            // Content should remain unchanged
            const content = await fs.readTextFile('/existing-file.txt');
            expect(content.unwrap()).toBe('content');
        });
    });

    describe('mkdir', () => {
        it('should create a new directory', async () => {
            const result = await fs.mkdir('/test-dir');
            expect(result.isOk()).toBe(true);

            const exists = await fs.exists('/test-dir', { isDirectory: true });
            expect(exists.isOk()).toBe(true);
            expect(exists.unwrap()).toBe(true);
        });

        it('should create nested directories (mkdir -p)', async () => {
            const result = await fs.mkdir('/nested/a//b/c/d');
            expect(result.isOk()).toBe(true);

            const exists = await fs.exists('/nested/a/b/c/d', { isDirectory: true });
            expect(exists.isOk()).toBe(true);
            expect(exists.unwrap()).toBe(true);
        });

        it('should succeed if directory already exists', async () => {
            await fs.mkdir('/existing-dir');
            const result = await fs.mkdir('/existing-dir');
            expect(result.isOk()).toBe(true);
        });
    });

    describe('writeFile & readFile', () => {
        it('should write and read string content', async () => {
            const content = 'Hello, OPFS!';
            const writeResult = await fs.writeFile('/test-file.txt', content);
            expect(writeResult.isOk()).toBe(true);

            const readResult = await fs.readTextFile('/test-file.txt');
            expect(readResult.isOk()).toBe(true);
            expect(readResult.unwrap()).toBe(content);
        });

        it('should write and read binary content', async () => {
            const data = new Uint8Array([1, 2, 3, 4, 5]);
            const writeResult = await fs.writeFile('/test-file.txt', data);
            expect(writeResult.isOk()).toBe(true);

            const readResult = await fs.readFile('/test-file.txt');
            expect(readResult.isOk()).toBe(true);
            const buffer = readResult.unwrap();
            expect(buffer.byteLength).toBe(5);
            expect(new Uint8Array(buffer)[0]).toBe(1);
        });

        it('should write and read Blob content', async () => {
            const blob = new Blob(['Blob content'], { type: 'text/plain' });
            await fs.writeFile('/test-file.txt', blob);

            const result = await fs.readFile('/test-file.txt', { encoding: 'blob' });
            const file = result.unwrap();
            expect(file.size).toBe(12);
        });

        it('should append content to existing file', async () => {
            await fs.writeFile('/test-file.txt', 'Hello');
            await fs.writeFile('/test-file.txt', ' World', { append: true });

            const result = await fs.readTextFile('/test-file.txt');
            expect(result.unwrap()).toBe('Hello World');
        });

        it('should fail to write when create is false and file does not exist', async () => {
            const result = await fs.writeFile('/non-existent.txt', 'content', { create: false });
            expect(result.isErr()).toBe(true);
        });

        it('should fail to read non-existent file', async () => {
            const result = await fs.readFile('/non-existent-file.txt');
            expect(result.isErr()).toBe(true);
        });
    });

    describe('readDir', () => {
        it('should read directory entries', async () => {
            await fs.mkdir('/test-readdir');
            await fs.writeFile('/test-readdir/file1.txt', 'a');
            await fs.writeFile('/test-readdir/file2.txt', 'b');
            await fs.mkdir('/test-readdir/subdir');

            const result = await fs.readDir('/test-readdir');
            const entries = await Array.fromAsync(result.unwrap());
            expect(entries.length).toBe(3);
        });

        it('should read directory recursively', async () => {
            await fs.mkdir('/test-readdir-recursive/sub1');
            await fs.mkdir('/test-readdir-recursive/sub2');
            await fs.writeFile('/test-readdir-recursive/file.txt', 'root');
            await fs.writeFile('/test-readdir-recursive/sub1/file.txt', 'sub1');
            await fs.writeFile('/test-readdir-recursive/sub2/file.txt', 'sub2');

            const result = await fs.readDir('/test-readdir-recursive', { recursive: true });
            const entries = await Array.fromAsync(result.unwrap());

            // sub1, sub2, file.txt, sub1/file.txt, sub2/file.txt
            expect(entries.length).toBe(5);
        });

        it('should fail to read non-existent directory', async () => {
            const result = await fs.readDir('/non-existent-dir');
            expect(result.isErr()).toBe(true);
        });
    });

    describe('stat', () => {
        it('should return file handle for file', async () => {
            await fs.writeFile('/test-stat-file.txt', 'content');

            const result = await fs.stat('/test-stat-file.txt');
            const handle = result.unwrap();
            expect(fs.isFileHandle(handle)).toBe(true);
            expect(handle.name).toBe('test-stat-file.txt');
        });

        it('should return directory handle for directory', async () => {
            await fs.mkdir('/test-stat-dir');

            const result = await fs.stat('/test-stat-dir');
            const handle = result.unwrap();
            expect(fs.isDirectoryHandle(handle)).toBe(true);
            expect(handle.name).toBe('test-stat-dir');
        });

        it('should fail for non-existent path', async () => {
            const result = await fs.stat('/non-existent-path');
            expect(result.isErr()).toBe(true);
        });
    });

    describe('remove', () => {
        it('should remove a file', async () => {
            await fs.writeFile('/test-file.txt', 'content');
            const result = await fs.remove('/test-file.txt');
            expect(result.isOk()).toBe(true);

            const exists = await fs.exists('/test-file.txt');
            expect(exists.unwrap()).toBe(false);
        });

        it('should remove a directory recursively', async () => {
            await fs.mkdir('/test-dir/sub');
            await fs.writeFile('/test-dir/file.txt', 'a');
            await fs.writeFile('/test-dir/sub/file.txt', 'b');

            const result = await fs.remove('/test-dir');
            expect(result.isOk()).toBe(true);

            const exists = await fs.exists('/test-dir');
            expect(exists.unwrap()).toBe(false);
        });

        it('should succeed for non-existent path', async () => {
            const result = await fs.remove('/definitely-not-exists');
            expect(result.isOk()).toBe(true);
        });
    });

    describe('exists', () => {
        it('should return true for existing file', async () => {
            await fs.writeFile('/test-file.txt', 'content');
            const exists = await fs.exists('/test-file.txt');
            expect(exists.unwrap()).toBe(true);
        });

        it('should return true for existing directory', async () => {
            await fs.mkdir('/test-dir');
            const exists = await fs.exists('/test-dir');
            expect(exists.unwrap()).toBe(true);
        });

        it('should return false for non-existent path', async () => {
            const exists = await fs.exists('/non-existent.txt');
            expect(exists.unwrap()).toBe(false);
        });

        it('should check isFile option', async () => {
            await fs.writeFile('/test-file.txt', 'content');
            await fs.mkdir('/test-dir');

            expect((await fs.exists('/test-file.txt', { isFile: true })).unwrap()).toBe(true);
            expect((await fs.exists('/test-dir', { isFile: true })).unwrap()).toBe(false);
        });

        it('should check isDirectory option', async () => {
            await fs.writeFile('/test-file.txt', 'content');
            await fs.mkdir('/test-dir');

            expect((await fs.exists('/test-file.txt', { isDirectory: true })).unwrap()).toBe(false);
            expect((await fs.exists('/test-dir', { isDirectory: true })).unwrap()).toBe(true);
        });
    });
});
