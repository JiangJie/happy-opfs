/**
 * Tests for extended sync OPFS operations
 */
import * as fs from '../../src/mod.ts';
import { assert, assertDeepEqual, assertEqual, assertErr, assertOk, describe, test } from '../test-utils.ts';

export async function testSyncExt(): Promise<void> {
    await describe('Sync Ext - copySync', async () => {
        await test('should copy a file', () => {
            fs.writeFileSync('/sync-copy-src.txt', 'Copy me');
            const result = fs.copySync('/sync-copy-src.txt', '/sync-copy-dest.txt');
            assertOk(result);

            // Both files should exist
            assert(assertOk(fs.existsSync('/sync-copy-src.txt')));
            assert(assertOk(fs.existsSync('/sync-copy-dest.txt')));

            // Content should be the same
            const content = fs.readTextFileSync('/sync-copy-dest.txt');
            assertEqual(assertOk(content), 'Copy me');

            fs.removeSync('/sync-copy-src.txt');
            fs.removeSync('/sync-copy-dest.txt');
        });

        await test('should copy a directory', () => {
            fs.mkdirSync('/sync-copy-dir-src/sub');
            fs.writeFileSync('/sync-copy-dir-src/file.txt', 'root');
            fs.writeFileSync('/sync-copy-dir-src/sub/file.txt', 'sub');

            const result = fs.copySync('/sync-copy-dir-src', '/sync-copy-dir-dest');
            assertOk(result);

            assert(assertOk(fs.existsSync('/sync-copy-dir-dest/file.txt')));
            assert(assertOk(fs.existsSync('/sync-copy-dir-dest/sub/file.txt')));

            fs.removeSync('/sync-copy-dir-src');
            fs.removeSync('/sync-copy-dir-dest');
        });

        await test('should not overwrite when overwrite is false', () => {
            fs.writeFileSync('/sync-copy-no-src.txt', 'New');
            fs.writeFileSync('/sync-copy-no-dest.txt', 'Old');

            fs.copySync('/sync-copy-no-src.txt', '/sync-copy-no-dest.txt', { overwrite: false });

            const content = fs.readTextFileSync('/sync-copy-no-dest.txt');
            assertEqual(assertOk(content), 'Old');

            fs.removeSync('/sync-copy-no-src.txt');
            fs.removeSync('/sync-copy-no-dest.txt');
        });

        await test('should fail when src and dest are different types', () => {
            fs.writeFileSync('/sync-copy-mismatch.txt', 'file');
            fs.mkdirSync('/sync-copy-mismatch-dir');

            const result = fs.copySync('/sync-copy-mismatch.txt', '/sync-copy-mismatch-dir');
            assertErr(result);

            fs.removeSync('/sync-copy-mismatch.txt');
            fs.removeSync('/sync-copy-mismatch-dir');
        });
    });

    await describe('Sync Ext - moveSync', async () => {
        await test('should move a file', () => {
            fs.writeFileSync('/sync-move-src.txt', 'Move me');
            const result = fs.moveSync('/sync-move-src.txt', '/sync-move-dest.txt');
            assertOk(result);

            assert(!assertOk(fs.existsSync('/sync-move-src.txt')));
            assert(assertOk(fs.existsSync('/sync-move-dest.txt')));

            const content = fs.readTextFileSync('/sync-move-dest.txt');
            assertEqual(assertOk(content), 'Move me');

            fs.removeSync('/sync-move-dest.txt');
        });

        await test('should move a directory', () => {
            fs.mkdirSync('/sync-move-dir-src/sub');
            fs.writeFileSync('/sync-move-dir-src/file.txt', 'root');

            const result = fs.moveSync('/sync-move-dir-src', '/sync-move-dir-dest');
            assertOk(result);

            assert(!assertOk(fs.existsSync('/sync-move-dir-src')));
            assert(assertOk(fs.existsSync('/sync-move-dir-dest/file.txt')));

            fs.removeSync('/sync-move-dir-dest');
        });
    });

    await describe('Sync Ext - emptyDirSync', async () => {
        await test('should empty an existing directory', () => {
            fs.mkdirSync('/sync-empty-dir');
            fs.writeFileSync('/sync-empty-dir/file1.txt', 'a');
            fs.writeFileSync('/sync-empty-dir/file2.txt', 'b');

            const result = fs.emptyDirSync('/sync-empty-dir');
            assertOk(result);

            assert(assertOk(fs.existsSync('/sync-empty-dir', { isDirectory: true })));
            const entries = fs.readDirSync('/sync-empty-dir');
            assertEqual(assertOk(entries).length, 0);

            fs.removeSync('/sync-empty-dir');
        });

        await test('should create directory if not exists', () => {
            const result = fs.emptyDirSync('/sync-new-empty-dir');
            assertOk(result);

            assert(assertOk(fs.existsSync('/sync-new-empty-dir', { isDirectory: true })));

            fs.removeSync('/sync-new-empty-dir');
        });
    });

    await describe('Sync Ext - existsSync', async () => {
        await test('should return true for existing file', () => {
            fs.writeFileSync('/sync-exists.txt', 'content');

            const result = fs.existsSync('/sync-exists.txt');
            assert(assertOk(result));

            fs.removeSync('/sync-exists.txt');
        });

        await test('should return false for non-existent path', () => {
            const result = fs.existsSync('/sync-not-exists');
            assert(!assertOk(result));
        });

        await test('should check isFile option', () => {
            fs.writeFileSync('/sync-exists-isfile.txt', 'content');
            fs.mkdirSync('/sync-exists-isfile-dir');

            assert(assertOk(fs.existsSync('/sync-exists-isfile.txt', { isFile: true })));
            assert(!assertOk(fs.existsSync('/sync-exists-isfile-dir', { isFile: true })));

            fs.removeSync('/sync-exists-isfile.txt');
            fs.removeSync('/sync-exists-isfile-dir');
        });

        await test('should check isDirectory option', () => {
            fs.writeFileSync('/sync-exists-isdir.txt', 'content');
            fs.mkdirSync('/sync-exists-isdir-dir');

            assert(!assertOk(fs.existsSync('/sync-exists-isdir.txt', { isDirectory: true })));
            assert(assertOk(fs.existsSync('/sync-exists-isdir-dir', { isDirectory: true })));

            fs.removeSync('/sync-exists-isdir.txt');
            fs.removeSync('/sync-exists-isdir-dir');
        });
    });

    await describe('Sync Ext - readJsonFileSync & writeJsonFileSync', async () => {
        await test('should write and read JSON object', () => {
            const data = { name: 'sync-test', value: 456 };

            const writeResult = fs.writeJsonFileSync('/sync-json.json', data);
            assertOk(writeResult);

            const readResult = fs.readJsonFileSync<typeof data>('/sync-json.json');
            assertDeepEqual(assertOk(readResult), data);

            fs.removeSync('/sync-json.json');
        });

        await test('should fail to read invalid JSON', () => {
            fs.writeFileSync('/sync-invalid.json', 'not json');

            const result = fs.readJsonFileSync('/sync-invalid.json');
            assertErr(result);

            fs.removeSync('/sync-invalid.json');
        });
    });
}
