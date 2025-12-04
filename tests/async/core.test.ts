/**
 * Tests for core OPFS operations: createFile, mkdir, readDir, readFile, writeFile, remove, stat
 */
import * as fs from '../../src/mod.ts';
import { assert, assertEqual, assertErr, assertOk, describe, test } from '../test-utils.ts';

export async function testCore(): Promise<void> {
    await describe('Core - createFile', async () => {
        await test('should create a new empty file', async () => {
            const result = await fs.createFile('/test-create-file.txt');
            assertOk(result);

            const exists = await fs.exists('/test-create-file.txt');
            assert(assertOk(exists));

            await fs.remove('/test-create-file.txt');
        });

        await test('should create file with nested directories', async () => {
            const result = await fs.createFile('/nested/dir/file.txt');
            assertOk(result);

            const exists = await fs.exists('/nested/dir/file.txt');
            assert(assertOk(exists));

            await fs.remove('/nested');
        });

        await test('should succeed if file already exists', async () => {
            await fs.writeFile('/existing-file.txt', 'content');
            const result = await fs.createFile('/existing-file.txt');
            assertOk(result);

            // Content should remain unchanged
            const content = await fs.readTextFile('/existing-file.txt');
            assertEqual(assertOk(content), 'content');

            await fs.remove('/existing-file.txt');
        });
    });

    await describe('Core - mkdir', async () => {
        await test('should create a new directory', async () => {
            const result = await fs.mkdir('/test-mkdir');
            assertOk(result);

            const exists = await fs.exists('/test-mkdir', { isDirectory: true });
            assert(assertOk(exists));

            await fs.remove('/test-mkdir');
        });

        await test('should create nested directories (mkdir -p)', async () => {
            const result = await fs.mkdir('/a/b/c/d');
            assertOk(result);

            const exists = await fs.exists('/a/b/c/d', { isDirectory: true });
            assert(assertOk(exists));

            await fs.remove('/a');
        });

        await test('should succeed if directory already exists', async () => {
            await fs.mkdir('/existing-dir');
            const result = await fs.mkdir('/existing-dir');
            assertOk(result);

            await fs.remove('/existing-dir');
        });
    });

    await describe('Core - writeFile & readFile', async () => {
        await test('should write and read string content', async () => {
            const content = 'Hello, OPFS!';
            await fs.writeFile('/test-string.txt', content);

            const result = await fs.readTextFile('/test-string.txt');
            assertEqual(assertOk(result), content);

            await fs.remove('/test-string.txt');
        });

        await test('should write and read binary content', async () => {
            const data = new Uint8Array([1, 2, 3, 4, 5]);
            await fs.writeFile('/test-binary.bin', data);

            const result = await fs.readFile('/test-binary.bin');
            const buffer = assertOk(result);
            assertEqual(buffer.byteLength, 5);
            assertEqual(new Uint8Array(buffer)[0], 1);

            await fs.remove('/test-binary.bin');
        });

        await test('should write and read Blob content', async () => {
            const blob = new Blob(['Blob content'], { type: 'text/plain' });
            await fs.writeFile('/test-blob.txt', blob);

            const result = await fs.readFile('/test-blob.txt', { encoding: 'blob' });
            const file = assertOk(result);
            assertEqual(file.size, 12);

            await fs.remove('/test-blob.txt');
        });

        await test('should append content to existing file', async () => {
            await fs.writeFile('/test-append.txt', 'Hello');
            await fs.writeFile('/test-append.txt', ' World', { append: true });

            const result = await fs.readTextFile('/test-append.txt');
            assertEqual(assertOk(result), 'Hello World');

            await fs.remove('/test-append.txt');
        });

        await test('should fail to write when create is false and file does not exist', async () => {
            const result = await fs.writeFile('/non-existent.txt', 'content', { create: false });
            assertErr(result);
        });

        await test('should fail to read non-existent file', async () => {
            const result = await fs.readFile('/non-existent-file.txt');
            assertErr(result);
        });
    });

    await describe('Core - readDir', async () => {
        await test('should read directory entries', async () => {
            await fs.mkdir('/test-readdir');
            await fs.writeFile('/test-readdir/file1.txt', 'a');
            await fs.writeFile('/test-readdir/file2.txt', 'b');
            await fs.mkdir('/test-readdir/subdir');

            const result = await fs.readDir('/test-readdir');
            const entries = await Array.fromAsync(assertOk(result));
            assertEqual(entries.length, 3);

            await fs.remove('/test-readdir');
        });

        await test('should read directory recursively', async () => {
            await fs.mkdir('/test-readdir-recursive/sub1');
            await fs.mkdir('/test-readdir-recursive/sub2');
            await fs.writeFile('/test-readdir-recursive/file.txt', 'root');
            await fs.writeFile('/test-readdir-recursive/sub1/file.txt', 'sub1');
            await fs.writeFile('/test-readdir-recursive/sub2/file.txt', 'sub2');

            const result = await fs.readDir('/test-readdir-recursive', { recursive: true });
            const entries = await Array.fromAsync(assertOk(result));

            // sub1, sub2, file.txt, sub1/file.txt, sub2/file.txt
            assertEqual(entries.length, 5);

            await fs.remove('/test-readdir-recursive');
        });

        await test('should fail to read non-existent directory', async () => {
            const result = await fs.readDir('/non-existent-dir');
            assertErr(result);
        });
    });

    await describe('Core - stat', async () => {
        await test('should return file handle for file', async () => {
            await fs.writeFile('/test-stat-file.txt', 'content');

            const result = await fs.stat('/test-stat-file.txt');
            const handle = assertOk(result);
            assert(fs.isFileHandle(handle));
            assertEqual(handle.name, 'test-stat-file.txt');

            await fs.remove('/test-stat-file.txt');
        });

        await test('should return directory handle for directory', async () => {
            await fs.mkdir('/test-stat-dir');

            const result = await fs.stat('/test-stat-dir');
            const handle = assertOk(result);
            assert(fs.isDirectoryHandle(handle));
            assertEqual(handle.name, 'test-stat-dir');

            await fs.remove('/test-stat-dir');
        });

        await test('should fail for non-existent path', async () => {
            const result = await fs.stat('/non-existent-path');
            assertErr(result);
        });
    });

    await describe('Core - remove', async () => {
        await test('should remove a file', async () => {
            await fs.writeFile('/test-remove-file.txt', 'content');
            const result = await fs.remove('/test-remove-file.txt');
            assertOk(result);

            const exists = await fs.exists('/test-remove-file.txt');
            assert(!assertOk(exists));
        });

        await test('should remove a directory recursively', async () => {
            await fs.mkdir('/test-remove-dir/sub');
            await fs.writeFile('/test-remove-dir/file.txt', 'a');
            await fs.writeFile('/test-remove-dir/sub/file.txt', 'b');

            const result = await fs.remove('/test-remove-dir');
            assertOk(result);

            const exists = await fs.exists('/test-remove-dir');
            assert(!assertOk(exists));
        });

        await test('should succeed for non-existent path', async () => {
            const result = await fs.remove('/definitely-not-exists');
            assertOk(result);
        });
    });
}
