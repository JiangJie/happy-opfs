/**
 * Tests for zip/unzip operations
 */
import * as fs from '../../src/mod.ts';
import { mockZipUrl } from '../constants.ts';
import { assert, assertEqual, assertOk, describe, test } from '../test-utils.ts';

export async function testZip(): Promise<void> {
    await describe('Zip - zip', async () => {
        await test('should zip a directory to file', async () => {
            await fs.mkdir('/zip-test');
            await fs.writeFile('/zip-test/file1.txt', 'content1');
            await fs.writeFile('/zip-test/file2.txt', 'content2');
            await fs.mkdir('/zip-test/sub');
            await fs.writeFile('/zip-test/sub/file3.txt', 'content3');

            const result = await fs.zip('/zip-test', '/test.zip');
            assertOk(result);

            assert(assertOk(await fs.exists('/test.zip')));

            await fs.remove('/zip-test');
            await fs.remove('/test.zip');
        });

        await test('should zip a directory to ArrayBuffer', async () => {
            await fs.mkdir('/zip-buffer');
            await fs.writeFile('/zip-buffer/file.txt', 'buffer content');

            const result = await fs.zip('/zip-buffer');
            const buffer = assertOk(result);

            assert(buffer instanceof Uint8Array);
            assert(buffer.byteLength > 0);

            await fs.remove('/zip-buffer');
        });

        await test('should zip with preserveRoot option', async () => {
            await fs.mkdir('/zip-root');
            await fs.writeFile('/zip-root/file.txt', 'root content');

            // With preserveRoot (default)
            const zipWithRoot = await fs.zip('/zip-root', '/with-root.zip');
            assertOk(zipWithRoot);

            // Without preserveRoot
            const zipWithoutRoot = await fs.zip('/zip-root', '/without-root.zip', { preserveRoot: false });
            assertOk(zipWithoutRoot);

            // Sizes should be different due to different path structures
            const sizeWith = (await fs.readFile('/with-root.zip')).unwrap().byteLength;
            const sizeWithout = (await fs.readFile('/without-root.zip')).unwrap().byteLength;
            assert(sizeWith !== sizeWithout);

            await fs.remove('/zip-root');
            await fs.remove('/with-root.zip');
            await fs.remove('/without-root.zip');
        });

        await test('should zip a single file', async () => {
            await fs.writeFile('/single-file.txt', 'single file content');

            const result = await fs.zip('/single-file.txt', '/single.zip');
            assertOk(result);

            assert(assertOk(await fs.exists('/single.zip')));

            await fs.remove('/single-file.txt');
            await fs.remove('/single.zip');
        });
    });

    await describe('Zip - unzip', async () => {
        await test('should unzip to a directory', async () => {
            // Create and zip a directory
            await fs.mkdir('/unzip-src');
            await fs.writeFile('/unzip-src/file1.txt', 'content1');
            await fs.writeFile('/unzip-src/file2.txt', 'content2');
            await fs.zip('/unzip-src', '/unzip-test.zip');

            // Unzip
            const result = await fs.unzip('/unzip-test.zip', '/unzip-dest');
            assertOk(result);

            // Verify extracted contents
            assert(assertOk(await fs.exists('/unzip-dest/unzip-src/file1.txt')));
            assert(assertOk(await fs.exists('/unzip-dest/unzip-src/file2.txt')));

            const content = await fs.readTextFile('/unzip-dest/unzip-src/file1.txt');
            assertEqual(assertOk(content), 'content1');

            await fs.remove('/unzip-src');
            await fs.remove('/unzip-test.zip');
            await fs.remove('/unzip-dest');
        });
    });

    await describe('Zip - unzipFromUrl', async () => {
        await test('should unzip from URL', async () => {
            const result = await fs.unzipFromUrl(mockZipUrl, '/url-unzip');
            assertOk(result);

            assert(assertOk(await fs.exists('/url-unzip')));

            await fs.remove('/url-unzip');
        });

        await test('should unzip from URL with download progress', async () => {
            let progressCalled = false;

            const result = await fs.unzipFromUrl(mockZipUrl, '/url-unzip-progress', {
                onProgress: (progressResult) => {
                    progressResult.inspect(() => {
                        progressCalled = true;
                    });
                },
            });
            assertOk(result);

            assert(progressCalled);

            await fs.remove('/url-unzip-progress');
        });
    });

    await describe('Zip - zipFromUrl', async () => {
        await test('should download and save zip from URL', async () => {
            const result = await fs.zipFromUrl(mockZipUrl, '/url.zip');
            assertOk(result);

            assert(assertOk(await fs.exists('/url.zip')));

            await fs.remove('/url.zip');
        });

        await test('should download zip as ArrayBuffer', async () => {
            const result = await fs.zipFromUrl(mockZipUrl);
            const buffer = assertOk(result);

            assert(buffer instanceof Uint8Array);
            assert(buffer.byteLength > 0);
        });
    });
}
