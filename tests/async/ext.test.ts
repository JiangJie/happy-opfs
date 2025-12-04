/**
 * Tests for extended OPFS operations: appendFile, copy, move, emptyDir, exists, readBlobFile, readTextFile, readJsonFile, writeJsonFile
 */
import * as fs from '../../src/mod.ts';
import { assert, assertDeepEqual, assertEqual, assertErr, assertOk, describe, test } from '../test-utils.ts';

export async function testExt(): Promise<void> {
    await describe('Ext - appendFile', async () => {
        await test('should append content to existing file', async () => {
            await fs.writeFile('/test-append.txt', 'Hello');
            await fs.appendFile('/test-append.txt', ' World');

            const content = await fs.readTextFile('/test-append.txt');
            assertEqual(assertOk(content), 'Hello World');

            await fs.remove('/test-append.txt');
        });

        await test('should create file if not exists', async () => {
            await fs.appendFile('/test-append-new.txt', 'New content');

            const content = await fs.readTextFile('/test-append-new.txt');
            assertEqual(assertOk(content), 'New content');

            await fs.remove('/test-append-new.txt');
        });

        await test('should append binary content', async () => {
            await fs.writeFile('/test-append-bin.bin', new Uint8Array([1, 2, 3]));
            await fs.appendFile('/test-append-bin.bin', new Uint8Array([4, 5, 6]));

            const result = await fs.readFile('/test-append-bin.bin');
            const buffer = assertOk(result);
            assertEqual(buffer.byteLength, 6);

            await fs.remove('/test-append-bin.bin');
        });
    });

    await describe('Ext - copy', async () => {
        await test('should copy a file', async () => {
            await fs.writeFile('/copy-src.txt', 'Copy me');
            const result = await fs.copy('/copy-src.txt', '/copy-dest.txt');
            assertOk(result);

            // Both files should exist
            assert(assertOk(await fs.exists('/copy-src.txt')));
            assert(assertOk(await fs.exists('/copy-dest.txt')));

            // Content should be the same
            const content = await fs.readTextFile('/copy-dest.txt');
            assertEqual(assertOk(content), 'Copy me');

            await fs.remove('/copy-src.txt');
            await fs.remove('/copy-dest.txt');
        });

        await test('should copy a directory', async () => {
            await fs.mkdir('/copy-dir-src/sub');
            await fs.writeFile('/copy-dir-src/file.txt', 'root');
            await fs.writeFile('/copy-dir-src/sub/file.txt', 'sub');

            const result = await fs.copy('/copy-dir-src', '/copy-dir-dest');
            assertOk(result);

            // Verify copied structure
            assert(assertOk(await fs.exists('/copy-dir-dest/file.txt')));
            assert(assertOk(await fs.exists('/copy-dir-dest/sub/file.txt')));

            await fs.remove('/copy-dir-src');
            await fs.remove('/copy-dir-dest');
        });

        await test('should overwrite by default', async () => {
            await fs.writeFile('/copy-overwrite-src.txt', 'New content');
            await fs.writeFile('/copy-overwrite-dest.txt', 'Old content');

            await fs.copy('/copy-overwrite-src.txt', '/copy-overwrite-dest.txt');

            const content = await fs.readTextFile('/copy-overwrite-dest.txt');
            assertEqual(assertOk(content), 'New content');

            await fs.remove('/copy-overwrite-src.txt');
            await fs.remove('/copy-overwrite-dest.txt');
        });

        await test('should not overwrite when overwrite is false', async () => {
            await fs.writeFile('/copy-no-overwrite-src.txt', 'New content');
            await fs.writeFile('/copy-no-overwrite-dest.txt', 'Old content');

            await fs.copy('/copy-no-overwrite-src.txt', '/copy-no-overwrite-dest.txt', { overwrite: false });

            const content = await fs.readTextFile('/copy-no-overwrite-dest.txt');
            assertEqual(assertOk(content), 'Old content');

            await fs.remove('/copy-no-overwrite-src.txt');
            await fs.remove('/copy-no-overwrite-dest.txt');
        });

        await test('should fail when src and dest are different types', async () => {
            await fs.writeFile('/copy-type-mismatch.txt', 'file');
            await fs.mkdir('/copy-type-mismatch-dir');

            const result = await fs.copy('/copy-type-mismatch.txt', '/copy-type-mismatch-dir');
            assertErr(result);

            await fs.remove('/copy-type-mismatch.txt');
            await fs.remove('/copy-type-mismatch-dir');
        });
    });

    await describe('Ext - move', async () => {
        await test('should move a file', async () => {
            await fs.writeFile('/move-src.txt', 'Move me');
            const result = await fs.move('/move-src.txt', '/move-dest.txt');
            assertOk(result);

            // Source should not exist
            assert(!assertOk(await fs.exists('/move-src.txt')));
            // Destination should exist
            assert(assertOk(await fs.exists('/move-dest.txt')));

            const content = await fs.readTextFile('/move-dest.txt');
            assertEqual(assertOk(content), 'Move me');

            await fs.remove('/move-dest.txt');
        });

        await test('should move a directory', async () => {
            await fs.mkdir('/move-dir-src/sub');
            await fs.writeFile('/move-dir-src/file.txt', 'root');

            const result = await fs.move('/move-dir-src', '/move-dir-dest');
            assertOk(result);

            assert(!assertOk(await fs.exists('/move-dir-src')));
            assert(assertOk(await fs.exists('/move-dir-dest/file.txt')));

            await fs.remove('/move-dir-dest');
        });

        await test('should overwrite by default', async () => {
            await fs.writeFile('/move-overwrite-src.txt', 'New');
            await fs.writeFile('/move-overwrite-dest.txt', 'Old');

            await fs.move('/move-overwrite-src.txt', '/move-overwrite-dest.txt');

            const content = await fs.readTextFile('/move-overwrite-dest.txt');
            assertEqual(assertOk(content), 'New');

            await fs.remove('/move-overwrite-dest.txt');
        });
    });

    await describe('Ext - emptyDir', async () => {
        await test('should empty an existing directory', async () => {
            await fs.mkdir('/empty-dir-test');
            await fs.writeFile('/empty-dir-test/file1.txt', 'a');
            await fs.writeFile('/empty-dir-test/file2.txt', 'b');
            await fs.mkdir('/empty-dir-test/sub');

            const result = await fs.emptyDir('/empty-dir-test');
            assertOk(result);

            // Directory should exist but be empty
            assert(assertOk(await fs.exists('/empty-dir-test', { isDirectory: true })));
            const entries = await Array.fromAsync(assertOk(await fs.readDir('/empty-dir-test')));
            assertEqual(entries.length, 0);

            await fs.remove('/empty-dir-test');
        });

        await test('should create directory if not exists', async () => {
            const result = await fs.emptyDir('/new-empty-dir');
            assertOk(result);

            assert(assertOk(await fs.exists('/new-empty-dir', { isDirectory: true })));

            await fs.remove('/new-empty-dir');
        });
    });

    await describe('Ext - exists', async () => {
        await test('should return true for existing file', async () => {
            await fs.writeFile('/exists-test.txt', 'content');

            const result = await fs.exists('/exists-test.txt');
            assert(assertOk(result));

            await fs.remove('/exists-test.txt');
        });

        await test('should return true for existing directory', async () => {
            await fs.mkdir('/exists-dir-test');

            const result = await fs.exists('/exists-dir-test');
            assert(assertOk(result));

            await fs.remove('/exists-dir-test');
        });

        await test('should return false for non-existent path', async () => {
            const result = await fs.exists('/definitely-not-exists');
            assert(!assertOk(result));
        });

        await test('should check isFile option', async () => {
            await fs.writeFile('/exists-isfile.txt', 'content');
            await fs.mkdir('/exists-isfile-dir');

            assert(assertOk(await fs.exists('/exists-isfile.txt', { isFile: true })));
            assert(!assertOk(await fs.exists('/exists-isfile-dir', { isFile: true })));

            await fs.remove('/exists-isfile.txt');
            await fs.remove('/exists-isfile-dir');
        });

        await test('should check isDirectory option', async () => {
            await fs.writeFile('/exists-isdir.txt', 'content');
            await fs.mkdir('/exists-isdir-dir');

            assert(!assertOk(await fs.exists('/exists-isdir.txt', { isDirectory: true })));
            assert(assertOk(await fs.exists('/exists-isdir-dir', { isDirectory: true })));

            await fs.remove('/exists-isdir.txt');
            await fs.remove('/exists-isdir-dir');
        });
    });

    await describe('Ext - readBlobFile', async () => {
        await test('should read file as File object', async () => {
            await fs.writeFile('/blob-test.txt', 'Blob content');

            const result = await fs.readBlobFile('/blob-test.txt');
            const file = assertOk(result);

            assert(file instanceof File);
            assertEqual(file.name, 'blob-test.txt');
            assertEqual(file.size, 12);

            await fs.remove('/blob-test.txt');
        });
    });

    await describe('Ext - readJsonFile & writeJsonFile', async () => {
        await test('should write and read JSON object', async () => {
            const data = { name: 'test', value: 123, nested: { a: 1 } };

            const writeResult = await fs.writeJsonFile('/json-test.json', data);
            assertOk(writeResult);

            const readResult = await fs.readJsonFile<typeof data>('/json-test.json');
            const parsed = assertOk(readResult);
            assertDeepEqual(parsed, data);

            await fs.remove('/json-test.json');
        });

        await test('should write and read JSON array', async () => {
            const data = [1, 2, 3, { a: 'b' }];

            await fs.writeJsonFile('/json-array.json', data);

            const result = await fs.readJsonFile<typeof data>('/json-array.json');
            assertDeepEqual(assertOk(result), data);

            await fs.remove('/json-array.json');
        });

        await test('should fail to read invalid JSON', async () => {
            await fs.writeFile('/invalid.json', 'not valid json');

            const result = await fs.readJsonFile('/invalid.json');
            assertErr(result);

            await fs.remove('/invalid.json');
        });
    });
}
