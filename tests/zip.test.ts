/**
 * Zip/Unzip operations tests using Vitest
 * Tests: zip, unzip, zipFromUrl, unzipFromUrl
 */
import { afterEach, describe, expect, it } from 'vitest';
import * as fs from '../src/mod.ts';

const mockZipUrl = 'https://raw.githubusercontent.com/JiangJie/happy-opfs/main/tests/test.zip';

describe('OPFS Zip Operations', () => {
    afterEach(async () => {
        await fs.remove('/zip-test');
        await fs.remove('/test.zip');
        await fs.remove('/zip-buffer');
        await fs.remove('/zip-root');
        await fs.remove('/with-root.zip');
        await fs.remove('/without-root.zip');
        await fs.remove('/single-file.txt');
        await fs.remove('/single.zip');
        await fs.remove('/unzip-src');
        await fs.remove('/unzip-test.zip');
        await fs.remove('/unzip-dest');
        await fs.remove('/url-unzip');
        await fs.remove('/url-unzip-progress');
        await fs.remove('/url.zip');
    });

    describe('zip', () => {
        it('should zip a directory to file', async () => {
            await fs.mkdir('/zip-test');
            await fs.writeFile('/zip-test/file1.txt', 'content1');
            await fs.writeFile('/zip-test/file2.txt', 'content2');
            await fs.mkdir('/zip-test/sub');
            await fs.writeFile('/zip-test/sub/file3.txt', 'content3');

            const result = await fs.zip('/zip-test', '/test.zip');
            expect(result.isOk()).toBe(true);

            expect((await fs.exists('/test.zip')).unwrap()).toBe(true);
        });

        it('should zip a directory to ArrayBuffer', async () => {
            await fs.mkdir('/zip-buffer');
            await fs.writeFile('/zip-buffer/file.txt', 'buffer content');

            const result = await fs.zip('/zip-buffer');
            const buffer = result.unwrap();

            expect(buffer instanceof Uint8Array).toBe(true);
            expect(buffer.byteLength).toBeGreaterThan(0);
        });

        it('should zip with preserveRoot option', async () => {
            await fs.mkdir('/zip-root');
            await fs.writeFile('/zip-root/file.txt', 'root content');

            // With preserveRoot (default)
            const zipWithRoot = await fs.zip('/zip-root', '/with-root.zip');
            expect(zipWithRoot.isOk()).toBe(true);

            // Without preserveRoot
            const zipWithoutRoot = await fs.zip('/zip-root', '/without-root.zip', { preserveRoot: false });
            expect(zipWithoutRoot.isOk()).toBe(true);

            // Sizes should be different due to different path structures
            const sizeWith = (await fs.readFile('/with-root.zip')).unwrap().byteLength;
            const sizeWithout = (await fs.readFile('/without-root.zip')).unwrap().byteLength;
            expect(sizeWith).not.toBe(sizeWithout);
        });

        it('should zip a single file', async () => {
            await fs.writeFile('/single-file.txt', 'single file content');

            const result = await fs.zip('/single-file.txt', '/single.zip');
            expect(result.isOk()).toBe(true);

            expect((await fs.exists('/single.zip')).unwrap()).toBe(true);
        });

        it('should fail to zip non-existent path', async () => {
            const result = await fs.zip('/non-existent-path', '/test.zip');
            expect(result.isErr()).toBe(true);
        });

        it('should zip an empty directory', async () => {
            await fs.mkdir('/empty-dir');

            const result = await fs.zip('/empty-dir', '/empty.zip');
            expect(result.isOk()).toBe(true);

            // Empty zip should still be created
            expect((await fs.exists('/empty.zip')).unwrap()).toBe(true);

            // Verify it's a valid but minimal zip file
            const zipData = (await fs.readFile('/empty.zip')).unwrap();
            expect(zipData.byteLength).toBeGreaterThan(0);

            // Clean up
            await fs.remove('/empty-dir');
            await fs.remove('/empty.zip');
        });

        it('should include directory entries in zip', async () => {
            // Create structure with nested empty directories
            await fs.mkdir('/dir-test');
            await fs.mkdir('/dir-test/subdir');
            await fs.mkdir('/dir-test/empty-subdir');
            await fs.writeFile('/dir-test/subdir/file.txt', 'content');

            const result = await fs.zip('/dir-test', '/dir-test.zip');
            expect(result.isOk()).toBe(true);

            // Unzip and verify directory structure
            const unzipResult = await fs.unzip('/dir-test.zip', '/dir-test-unzipped');
            expect(unzipResult.isOk()).toBe(true);

            // Empty subdirectory should exist after unzip
            expect((await fs.exists('/dir-test-unzipped/dir-test/empty-subdir', { isDirectory: true })).unwrap()).toBe(true);

            // Clean up
            await fs.remove('/dir-test');
            await fs.remove('/dir-test.zip');
            await fs.remove('/dir-test-unzipped');
        });
    });

    describe('unzip', () => {
        it('should unzip to a directory', async () => {
            // Create and zip a directory
            await fs.mkdir('/unzip-src');
            await fs.writeFile('/unzip-src/file1.txt', 'content1');
            await fs.writeFile('/unzip-src/file2.txt', 'content2');
            await fs.zip('/unzip-src', '/unzip-test.zip');

            // Unzip
            const result = await fs.unzip('/unzip-test.zip', '/unzip-dest');
            expect(result.isOk()).toBe(true);

            // Verify extracted contents
            expect((await fs.exists('/unzip-dest/unzip-src/file1.txt')).unwrap()).toBe(true);
            expect((await fs.exists('/unzip-dest/unzip-src/file2.txt')).unwrap()).toBe(true);

            const content = await fs.readTextFile('/unzip-dest/unzip-src/file1.txt');
            expect(content.unwrap()).toBe('content1');
        });

        it('should fail to unzip invalid zip data', async () => {
            // Create a file with invalid zip format (random bytes that are not valid zip)
            const invalidZipData = new Uint8Array([0x00, 0x01, 0x02, 0x03, 0x04, 0x05]);
            await fs.writeFile('/invalid.zip', invalidZipData);

            // Attempt to unzip should fail
            const result = await fs.unzip('/invalid.zip', '/invalid-dest');
            expect(result.isErr()).toBe(true);

            // Clean up
            await fs.remove('/invalid.zip');
            await fs.remove('/invalid-dest');
        });

        it('should fail when destDir is a file', async () => {
            // Create a zip file first
            await fs.mkdir('/unzip-src');
            await fs.writeFile('/unzip-src/file.txt', 'content');
            await fs.zip('/unzip-src', '/unzip-test.zip');

            // Create a file at the destDir path
            await fs.writeFile('/unzip-dest-file', 'I am a file');

            // Unzip should fail because destDir is a file
            const result = await fs.unzip('/unzip-test.zip', '/unzip-dest-file');
            expect(result.isErr()).toBe(true);
            expect(result.unwrapErr().message).toContain('is a file, not a directory');

            // Clean up
            await fs.remove('/unzip-dest-file');
        });
    });

    describe('unzipFromUrl', () => {
        it('should unzip from URL', async () => {
            const result = await fs.unzipFromUrl(mockZipUrl, '/url-unzip');
            expect(result.isOk()).toBe(true);

            expect((await fs.exists('/url-unzip')).unwrap()).toBe(true);
        });

        it('should unzip from URL with download progress', async () => {
            let progressCalled = false;

            const result = await fs.unzipFromUrl(mockZipUrl, '/url-unzip-progress', {
                onProgress: (progressResult) => {
                    progressResult.inspect(() => {
                        progressCalled = true;
                    });
                },
            });
            expect(result.isOk()).toBe(true);

            expect(progressCalled).toBe(true);
        });
    });

    describe('zipFromUrl', () => {
        it('should download and save zip from URL', async () => {
            const result = await fs.zipFromUrl(mockZipUrl, '/url.zip');
            expect(result.isOk()).toBe(true);

            expect((await fs.exists('/url.zip')).unwrap()).toBe(true);
        });

        it('should download zip as ArrayBuffer', async () => {
            const result = await fs.zipFromUrl(mockZipUrl);
            const buffer = result.unwrap();

            expect(buffer instanceof Uint8Array).toBe(true);
            expect(buffer.byteLength).toBeGreaterThan(0);
        });
    });
});
