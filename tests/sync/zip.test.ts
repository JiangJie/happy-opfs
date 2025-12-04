/**
 * Tests for sync zip/unzip operations
 */
import * as fs from '../../src/mod.ts';
import { assert, assertEqual, assertOk, describe, test } from '../test-utils.ts';

export async function testSyncZip(): Promise<void> {
    await describe('Sync Zip - zipSync', async () => {
        await test('should zip a directory to file', () => {
            fs.mkdirSync('/sync-zip-test');
            fs.writeFileSync('/sync-zip-test/file1.txt', 'content1');
            fs.writeFileSync('/sync-zip-test/file2.txt', 'content2');

            const result = fs.zipSync('/sync-zip-test', '/sync-test.zip');
            assertOk(result);

            assert(assertOk(fs.existsSync('/sync-test.zip')));

            fs.removeSync('/sync-zip-test');
            fs.removeSync('/sync-test.zip');
        });

        await test('should zip a directory to ArrayBuffer', () => {
            fs.mkdirSync('/sync-zip-buffer');
            fs.writeFileSync('/sync-zip-buffer/file.txt', 'buffer content');

            const result = fs.zipSync('/sync-zip-buffer');
            const buffer = assertOk(result);

            assert(buffer instanceof Uint8Array);
            assert(buffer.byteLength > 0);

            fs.removeSync('/sync-zip-buffer');
        });

        await test('should zip with preserveRoot option', () => {
            fs.mkdirSync('/sync-zip-root');
            fs.writeFileSync('/sync-zip-root/file.txt', 'content');

            const zipWithRoot = fs.zipSync('/sync-zip-root', '/sync-with-root.zip');
            assertOk(zipWithRoot);

            const zipWithoutRoot = fs.zipSync('/sync-zip-root', '/sync-without-root.zip', { preserveRoot: false });
            assertOk(zipWithoutRoot);

            // Sizes should be different
            const sizeWith = fs.readFileSync('/sync-with-root.zip').unwrap().byteLength;
            const sizeWithout = fs.readFileSync('/sync-without-root.zip').unwrap().byteLength;
            assert(sizeWith !== sizeWithout);

            fs.removeSync('/sync-zip-root');
            fs.removeSync('/sync-with-root.zip');
            fs.removeSync('/sync-without-root.zip');
        });
    });

    await describe('Sync Zip - unzipSync', async () => {
        await test('should unzip to a directory', () => {
            // Create and zip a directory
            fs.mkdirSync('/sync-unzip-src');
            fs.writeFileSync('/sync-unzip-src/file1.txt', 'content1');
            fs.writeFileSync('/sync-unzip-src/file2.txt', 'content2');
            fs.zipSync('/sync-unzip-src', '/sync-unzip-test.zip');

            // Unzip
            const result = fs.unzipSync('/sync-unzip-test.zip', '/sync-unzip-dest');
            assertOk(result);

            // Verify extracted contents
            assert(assertOk(fs.existsSync('/sync-unzip-dest/sync-unzip-src/file1.txt')));
            assert(assertOk(fs.existsSync('/sync-unzip-dest/sync-unzip-src/file2.txt')));

            const content = fs.readTextFileSync('/sync-unzip-dest/sync-unzip-src/file1.txt');
            assertEqual(assertOk(content), 'content1');

            fs.removeSync('/sync-unzip-src');
            fs.removeSync('/sync-unzip-test.zip');
            fs.removeSync('/sync-unzip-dest');
        });
    });
}
