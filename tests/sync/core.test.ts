/**
 * Tests for core sync OPFS operations
 */
import * as fs from '../../src/mod.ts';
import { assert, assertEqual, assertErr, assertOk, describe, test } from '../test-utils.ts';

export async function testSyncCore(): Promise<void> {
    await describe('Sync Core - createFileSync', async () => {
        await test('should create a new empty file', () => {
            const result = fs.createFileSync('/sync-create-file.txt');
            assertOk(result);

            const exists = fs.existsSync('/sync-create-file.txt');
            assert(assertOk(exists));

            fs.removeSync('/sync-create-file.txt');
        });

        await test('should create file with nested directories', () => {
            const result = fs.createFileSync('/sync-nested/dir/file.txt');
            assertOk(result);

            const exists = fs.existsSync('/sync-nested/dir/file.txt');
            assert(assertOk(exists));

            fs.removeSync('/sync-nested');
        });
    });

    await describe('Sync Core - mkdirSync', async () => {
        await test('should create a new directory', () => {
            const result = fs.mkdirSync('/sync-mkdir');
            assertOk(result);

            const exists = fs.existsSync('/sync-mkdir', { isDirectory: true });
            assert(assertOk(exists));

            fs.removeSync('/sync-mkdir');
        });

        await test('should create nested directories', () => {
            const result = fs.mkdirSync('/sync-a/b/c');
            assertOk(result);

            const exists = fs.existsSync('/sync-a/b/c', { isDirectory: true });
            assert(assertOk(exists));

            fs.removeSync('/sync-a');
        });
    });

    await describe('Sync Core - writeFileSync & readFileSync', async () => {
        await test('should write and read string content', () => {
            const content = 'Hello, Sync OPFS!';
            fs.writeFileSync('/sync-string.txt', content);

            const result = fs.readTextFileSync('/sync-string.txt');
            assertEqual(assertOk(result), content);

            fs.removeSync('/sync-string.txt');
        });

        await test('should write and read binary content', () => {
            const data = new Uint8Array([1, 2, 3, 4, 5]);
            fs.writeFileSync('/sync-binary.bin', data);

            const result = fs.readFileSync('/sync-binary.bin');
            const buffer = assertOk(result);
            assertEqual(buffer.byteLength, 5);

            fs.removeSync('/sync-binary.bin');
        });

        await test('should append content', () => {
            fs.writeFileSync('/sync-append.txt', 'Hello');
            fs.appendFileSync('/sync-append.txt', ' World');

            const result = fs.readTextFileSync('/sync-append.txt');
            assertEqual(assertOk(result), 'Hello World');

            fs.removeSync('/sync-append.txt');
        });

        await test('should fail to read non-existent file', () => {
            const result = fs.readFileSync('/sync-non-existent.txt');
            assertErr(result);
        });
    });

    await describe('Sync Core - readBlobFileSync', async () => {
        await test('should read file as FileLike', () => {
            fs.writeFileSync('/sync-blob.txt', 'Blob content');

            const result = fs.readBlobFileSync('/sync-blob.txt');
            const fileLike = assertOk(result);

            assertEqual(fileLike.name, 'sync-blob.txt');
            assertEqual(fileLike.size, 12);
            assert(fileLike.data instanceof ArrayBuffer);

            fs.removeSync('/sync-blob.txt');
        });
    });

    await describe('Sync Core - readDirSync', async () => {
        await test('should read directory entries', () => {
            fs.mkdirSync('/sync-readdir');
            fs.writeFileSync('/sync-readdir/file1.txt', 'a');
            fs.writeFileSync('/sync-readdir/file2.txt', 'b');
            fs.mkdirSync('/sync-readdir/subdir');

            const result = fs.readDirSync('/sync-readdir');
            const entries = assertOk(result);
            assertEqual(entries.length, 3);

            fs.removeSync('/sync-readdir');
        });

        await test('should read directory recursively', () => {
            fs.mkdirSync('/sync-readdir-recursive/sub1');
            fs.mkdirSync('/sync-readdir-recursive/sub2');
            fs.writeFileSync('/sync-readdir-recursive/file.txt', 'root');
            fs.writeFileSync('/sync-readdir-recursive/sub1/file.txt', 'sub1');

            const result = fs.readDirSync('/sync-readdir-recursive', { recursive: true });
            const entries = assertOk(result);

            // sub1, sub2, file.txt, sub1/file.txt
            assertEqual(entries.length, 4);

            fs.removeSync('/sync-readdir-recursive');
        });
    });

    await describe('Sync Core - statSync', async () => {
        await test('should return file handle like for file', () => {
            fs.writeFileSync('/sync-stat-file.txt', 'content');

            const result = fs.statSync('/sync-stat-file.txt');
            const handleLike = assertOk(result);

            assert(fs.isFileHandleLike(handleLike));
            assertEqual(handleLike.name, 'sync-stat-file.txt');

            fs.removeSync('/sync-stat-file.txt');
        });

        await test('should return handle like for directory', () => {
            fs.mkdirSync('/sync-stat-dir');

            const result = fs.statSync('/sync-stat-dir');
            const handleLike = assertOk(result);

            assert(!fs.isFileHandleLike(handleLike));
            assertEqual(handleLike.kind, 'directory');

            fs.removeSync('/sync-stat-dir');
        });
    });

    await describe('Sync Core - removeSync', async () => {
        await test('should remove a file', () => {
            fs.writeFileSync('/sync-remove-file.txt', 'content');
            const result = fs.removeSync('/sync-remove-file.txt');
            assertOk(result);

            const exists = fs.existsSync('/sync-remove-file.txt');
            assert(!assertOk(exists));
        });

        await test('should remove a directory recursively', () => {
            fs.mkdirSync('/sync-remove-dir/sub');
            fs.writeFileSync('/sync-remove-dir/file.txt', 'a');

            const result = fs.removeSync('/sync-remove-dir');
            assertOk(result);

            const exists = fs.existsSync('/sync-remove-dir');
            assert(!assertOk(exists));
        });

        await test('should succeed for non-existent path', () => {
            const result = fs.removeSync('/sync-not-exists');
            assertOk(result);
        });
    });
}
