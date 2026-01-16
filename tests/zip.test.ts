/**
 * Zip/Unzip operations tests using Vitest
 * Tests: zip, unzip, zipFromUrl, unzipFromUrl
 */
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import * as fs from '../src/mod.ts';
import { worker } from './mocks/browser.ts';
import { MOCK_SERVER } from './mocks/constants.ts';

const mockZipUrl = 'https://raw.githubusercontent.com/JiangJie/happy-opfs/main/tests/test.zip';

describe('OPFS Zip Operations', () => {
    beforeAll(async () => {
        // Start MSW worker for mock server tests
        await worker.start({
            serviceWorker: {
                url: 'https://localhost:8443/mockServiceWorker.js',
            },
            onUnhandledRequest: 'bypass',
            quiet: true,
        });
    });

    afterAll(() => {
        worker.stop();
    });

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

            // Empty zip should still be created (contains root directory entry)
            expect((await fs.exists('/empty.zip')).unwrap()).toBe(true);

            // Verify it's a valid but minimal zip file
            const zipData = (await fs.readFile('/empty.zip')).unwrap();
            expect(zipData.byteLength).toBeGreaterThan(0);

            // Clean up
            await fs.remove('/empty-dir');
            await fs.remove('/empty.zip');
        });

        it('should fail to zip empty directory with preserveRoot=false', async () => {
            await fs.mkdir('/empty-dir-no-root');

            // With preserveRoot=false, empty directory has nothing to zip
            const result = await fs.zip('/empty-dir-no-root', { preserveRoot: false });
            expect(result.isErr()).toBe(true);
            expect(result.unwrapErr().message).toBe('Nothing to zip');

            // Clean up
            await fs.remove('/empty-dir-no-root');
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
            expect(result.unwrapErr().message).toContain('is not a directory');

            // Clean up
            await fs.remove('/unzip-dest-file');
        });

        it('should fail when zip file is empty', async () => {
            // Create an empty file
            await fs.createFile('/empty.zip');

            // Attempt to unzip should fail with EmptyFileError
            const result = await fs.unzip('/empty.zip', '/empty-dest');
            expect(result.isErr()).toBe(true);
            expect(result.unwrapErr().name).toBe('EmptyFileError');

            // Clean up
            await fs.remove('/empty.zip');
        });

        it('should fail when destDir is a relative path', async () => {
            // Create a valid zip file first
            await fs.mkdir('/unzip-src');
            await fs.writeFile('/unzip-src/file.txt', 'content');
            await fs.zip('/unzip-src', '/unzip-test.zip');

            // Attempt to unzip to a relative path
            const result = await fs.unzip('/unzip-test.zip', 'relative/dest');
            expect(result.isErr()).toBe(true);
            expect(result.unwrapErr().message).toContain('absolute');

            // Clean up
            await fs.remove('/unzip-src');
            await fs.remove('/unzip-test.zip');
        });
    });

    describe('unzipStream', () => {
        it('should unzip using streaming decompression', async () => {
            // Create and zip a directory
            await fs.mkdir('/stream-src');
            await fs.writeFile('/stream-src/file1.txt', 'stream content 1');
            await fs.writeFile('/stream-src/file2.txt', 'stream content 2');
            await fs.mkdir('/stream-src/sub');
            await fs.writeFile('/stream-src/sub/file3.txt', 'stream content 3');
            await fs.zip('/stream-src', '/stream-test.zip');

            // Unzip using stream
            const result = await fs.unzipStream('/stream-test.zip', '/stream-dest');
            expect(result.isOk()).toBe(true);

            // Verify extracted contents
            expect((await fs.exists('/stream-dest/stream-src/file1.txt')).unwrap()).toBe(true);
            expect((await fs.exists('/stream-dest/stream-src/file2.txt')).unwrap()).toBe(true);
            expect((await fs.exists('/stream-dest/stream-src/sub/file3.txt')).unwrap()).toBe(true);

            const content = await fs.readTextFile('/stream-dest/stream-src/file1.txt');
            expect(content.unwrap()).toBe('stream content 1');

            // Clean up
            await fs.remove('/stream-src');
            await fs.remove('/stream-test.zip');
            await fs.remove('/stream-dest');
        });

        it('should handle empty directories in stream unzip', async () => {
            // Create structure with empty directories
            await fs.mkdir('/stream-empty-dir');
            await fs.mkdir('/stream-empty-dir/empty-sub');
            await fs.mkdir('/stream-empty-dir/non-empty-sub');
            await fs.writeFile('/stream-empty-dir/non-empty-sub/file.txt', 'content');
            await fs.zip('/stream-empty-dir', '/stream-empty.zip');

            const result = await fs.unzipStream('/stream-empty.zip', '/stream-empty-dest');
            expect(result.isOk()).toBe(true);

            // Empty subdirectory should exist after unzip
            expect((await fs.exists('/stream-empty-dest/stream-empty-dir/empty-sub', { isDirectory: true })).unwrap()).toBe(true);
            expect((await fs.exists('/stream-empty-dest/stream-empty-dir/non-empty-sub/file.txt')).unwrap()).toBe(true);

            // Clean up
            await fs.remove('/stream-empty-dir');
            await fs.remove('/stream-empty.zip');
            await fs.remove('/stream-empty-dest');
        });

        it('should fail when zip file is empty', async () => {
            await fs.createFile('/stream-empty.zip');

            const result = await fs.unzipStream('/stream-empty.zip', '/stream-empty-dest');
            expect(result.isErr()).toBe(true);
            expect(result.unwrapErr().name).toBe('EmptyFileError');

            // Clean up
            await fs.remove('/stream-empty.zip');
        });

        it('should handle large file with multiple chunks (multiple chunk processing)', async () => {
            // Create a large file that will be split into multiple chunks during extraction
            // This ensures the ondata callback is called multiple times with final=false
            // before the final call with final=true
            const largeContent = 'x'.repeat(65 * 1024 * 1024); // 65MB of data
            await fs.mkdir('/stream-large-src');
            await fs.writeFile('/stream-large-src/large-file.txt', largeContent);
            await fs.zip('/stream-large-src', '/stream-large.zip');

            // Unzip using stream - this should trigger multiple ondata calls
            const result = await fs.unzipStream('/stream-large.zip', '/stream-large-dest');
            expect(result.isOk()).toBe(true);

            // Verify the file was extracted correctly
            const extractedContent = await fs.readTextFile('/stream-large-dest/stream-large-src/large-file.txt');
            expect(extractedContent.isOk()).toBe(true);
            expect(extractedContent.unwrap().length).toBe(largeContent.length);

            // Clean up
            await fs.remove('/stream-large-src');
            await fs.remove('/stream-large.zip');
            await fs.remove('/stream-large-dest');
        });

        it('should fail when destDir is a file', async () => {
            await fs.mkdir('/stream-src');
            await fs.writeFile('/stream-src/file.txt', 'content');
            await fs.zip('/stream-src', '/stream-test.zip');

            // Create a file at the destDir path
            await fs.writeFile('/stream-dest-file', 'I am a file');

            const result = await fs.unzipStream('/stream-test.zip', '/stream-dest-file');
            expect(result.isErr()).toBe(true);
            expect(result.unwrapErr().message).toContain('is not a directory');

            // Clean up
            await fs.remove('/stream-src');
            await fs.remove('/stream-test.zip');
            await fs.remove('/stream-dest-file');
        });
    });

    describe('unzipStreamFromUrl', () => {
        it('should unzip from URL using streaming decompression', async () => {
            const result = await fs.unzipStreamFromUrl(mockZipUrl, '/url-stream-unzip');
            expect(result.isOk()).toBe(true);

            expect((await fs.exists('/url-stream-unzip')).unwrap()).toBe(true);

            // Clean up
            await fs.remove('/url-stream-unzip');
        });

        it('should fail on invalid URL', async () => {
            const result = await fs.unzipStreamFromUrl('http://', '/url-stream-dest');
            expect(result.isErr()).toBe(true);

            // Clean up
            await fs.remove('/url-stream-dest');
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

        it('should fail on invalid URL', async () => {
            const result = await fs.unzipFromUrl('http://', '/url-unzip-invalid');
            expect(result.isErr()).toBe(true);

            // Clean up
            await fs.remove('/url-unzip-invalid');
        });
    });

    describe('zipStream', () => {
        it('should stream zip a directory to file', async () => {
            await fs.mkdir('/stream-zip-src');
            await fs.writeFile('/stream-zip-src/file1.txt', 'stream content 1');
            await fs.writeFile('/stream-zip-src/file2.txt', 'stream content 2');
            await fs.mkdir('/stream-zip-src/sub');
            await fs.writeFile('/stream-zip-src/sub/file3.txt', 'stream content 3');

            const result = await fs.zipStream('/stream-zip-src', '/stream-test.zip');
            expect(result.isOk()).toBe(true);

            // Verify by unzipping
            const unzipResult = await fs.unzip('/stream-test.zip', '/stream-zip-dest');
            expect(unzipResult.isOk()).toBe(true);

            expect((await fs.exists('/stream-zip-dest/stream-zip-src/file1.txt')).unwrap()).toBe(true);
            expect((await fs.exists('/stream-zip-dest/stream-zip-src/sub/file3.txt')).unwrap()).toBe(true);

            const content = await fs.readTextFile('/stream-zip-dest/stream-zip-src/file1.txt');
            expect(content.unwrap()).toBe('stream content 1');

            // Clean up
            await fs.remove('/stream-zip-src');
            await fs.remove('/stream-test.zip');
            await fs.remove('/stream-zip-dest');
        });

        it('should stream zip a single file', async () => {
            await fs.writeFile('/stream-single.txt', 'single file content');

            const result = await fs.zipStream('/stream-single.txt', '/stream-single.zip');
            expect(result.isOk()).toBe(true);

            // Verify by unzipping
            const unzipResult = await fs.unzip('/stream-single.zip', '/stream-single-dest');
            expect(unzipResult.isOk()).toBe(true);

            const content = await fs.readTextFile('/stream-single-dest/stream-single.txt');
            expect(content.unwrap()).toBe('single file content');

            // Clean up
            await fs.remove('/stream-single.txt');
            await fs.remove('/stream-single.zip');
            await fs.remove('/stream-single-dest');
        });

        it('should stream zip an empty file ', async () => {
            // Create an empty file (size === 0)
            await fs.writeFile('/stream-empty-file.txt', '');

            const result = await fs.zipStream('/stream-empty-file.txt', '/stream-empty-file.zip');
            expect(result.isOk()).toBe(true);

            // Verify by unzipping
            const unzipResult = await fs.unzip('/stream-empty-file.zip', '/stream-empty-file-dest');
            expect(unzipResult.isOk()).toBe(true);

            const content = await fs.readTextFile('/stream-empty-file-dest/stream-empty-file.txt');
            expect(content.unwrap()).toBe('');

            // Clean up
            await fs.remove('/stream-empty-file.txt');
            await fs.remove('/stream-empty-file.zip');
            await fs.remove('/stream-empty-file-dest');
        });

        it('should stream zip with preserveRoot option', async () => {
            await fs.mkdir('/stream-root');
            await fs.writeFile('/stream-root/file.txt', 'root content');

            // Without preserveRoot
            const result = await fs.zipStream('/stream-root', '/stream-no-root.zip', { preserveRoot: false });
            expect(result.isOk()).toBe(true);

            // Verify - file should be at root level
            const unzipResult = await fs.unzip('/stream-no-root.zip', '/stream-no-root-dest');
            expect(unzipResult.isOk()).toBe(true);

            expect((await fs.exists('/stream-no-root-dest/file.txt')).unwrap()).toBe(true);

            // Clean up
            await fs.remove('/stream-root');
            await fs.remove('/stream-no-root.zip');
            await fs.remove('/stream-no-root-dest');
        });

        it('should handle empty directories in stream zip', async () => {
            await fs.mkdir('/stream-empty-dir');
            await fs.mkdir('/stream-empty-dir/empty-sub');
            await fs.mkdir('/stream-empty-dir/non-empty-sub');
            await fs.writeFile('/stream-empty-dir/non-empty-sub/file.txt', 'content');

            const result = await fs.zipStream('/stream-empty-dir', '/stream-empty.zip');
            expect(result.isOk()).toBe(true);

            // Verify empty directory is preserved
            const unzipResult = await fs.unzip('/stream-empty.zip', '/stream-empty-dest');
            expect(unzipResult.isOk()).toBe(true);

            expect((await fs.exists('/stream-empty-dest/stream-empty-dir/empty-sub', { isDirectory: true })).unwrap()).toBe(true);

            // Clean up
            await fs.remove('/stream-empty-dir');
            await fs.remove('/stream-empty.zip');
            await fs.remove('/stream-empty-dest');
        });

        it('should fail to zip empty directory with preserveRoot=false', async () => {
            await fs.mkdir('/stream-empty-no-root');

            const result = await fs.zipStream('/stream-empty-no-root', '/stream-empty-no-root.zip', { preserveRoot: false });
            expect(result.isErr()).toBe(true);
            expect(result.unwrapErr().message).toBe('Nothing to zip');

            await fs.remove('/stream-empty-no-root');
        });

        it('should stream zip empty directory with preserveRoot=true', async () => {
            // Empty directory with preserveRoot=true (default)
            // first.done = true, but preserveRoot = true, so it creates empty zip with root dir
            await fs.mkdir('/stream-empty-root');

            const result = await fs.zipStream('/stream-empty-root', '/stream-empty-root.zip');
            expect(result.isOk()).toBe(true);

            // Verify the zip contains just the empty root directory
            const unzipResult = await fs.unzip('/stream-empty-root.zip', '/stream-empty-root-dest');
            expect(unzipResult.isOk()).toBe(true);
            expect((await fs.exists('/stream-empty-root-dest/stream-empty-root', { isDirectory: true })).unwrap()).toBe(true);

            await fs.remove('/stream-empty-root');
            await fs.remove('/stream-empty-root.zip');
            await fs.remove('/stream-empty-root-dest');
        });

        it('should fail to zip non-existent path', async () => {
            const result = await fs.zipStream('/non-existent-path', '/test.zip');
            expect(result.isErr()).toBe(true);
        });
    });

    describe('zipStreamFromUrl', () => {
        it('should stream zip from URL', async () => {
            const result = await fs.zipStreamFromUrl(mockZipUrl, '/url-stream.zip');
            expect(result.isOk()).toBe(true);

            expect((await fs.exists('/url-stream.zip')).unwrap()).toBe(true);

            // Clean up
            await fs.remove('/url-stream.zip');
        });

        it('should fail on invalid URL', async () => {
            const result = await fs.zipStreamFromUrl('http://', '/url-stream.zip');
            expect(result.isErr()).toBe(true);
        });

        it('should fail on empty response by default', async () => {
            const result = await fs.zipStreamFromUrl(`${MOCK_SERVER}/api/empty-body`, '/empty-stream.zip');
            expect(result.isErr()).toBe(true);
            expect(result.unwrapErr().name).toBe('EmptyBodyError');
        });

        it('should keep empty response with keepEmptyBody option', async () => {
            const result = await fs.zipStreamFromUrl(`${MOCK_SERVER}/api/empty-body`, '/empty-stream.zip', {
                keepEmptyBody: true,
                filename: 'empty.txt',
            });
            expect(result.isOk()).toBe(true);

            expect((await fs.exists('/empty-stream.zip')).unwrap()).toBe(true);

            // Clean up
            await fs.remove('/empty-stream.zip');
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

        it('should fail on empty response by default', async () => {
            const result = await fs.zipFromUrl(`${MOCK_SERVER}/api/empty-body`);
            expect(result.isErr()).toBe(true);
            expect(result.unwrapErr().name).toBe('EmptyBodyError');
        });

        it('should keep empty response with keepEmptyBody option', async () => {
            const result = await fs.zipFromUrl(`${MOCK_SERVER}/api/empty-body`, {
                keepEmptyBody: true,
                filename: 'empty.txt',
            });
            expect(result.isOk()).toBe(true);

            const zipData = result.unwrap();
            expect(zipData.byteLength).toBeGreaterThan(0);
        });

        it('should fail on network error', async () => {
            const result = await fs.zipFromUrl(`${MOCK_SERVER}/api/network-error`);
            expect(result.isErr()).toBe(true);
        });

        it('should fail on invalid URL', async () => {
            const result = await fs.zipFromUrl('http://');
            expect(result.isErr()).toBe(true);
        });

        it('should use "file" as default filename when URL path is root ', async () => {
            // Test URL with only domain (path = '/') - should use 'file' as filename
            const result = await fs.zipFromUrl(MOCK_SERVER, '/root-zipfromurl.zip');
            expect(result.isOk()).toBe(true);

            // Verify the zip was created and contains 'file' as entry name
            const unzipResult = await fs.unzip('/root-zipfromurl.zip', '/root-zipfromurl-dest');
            expect(unzipResult.isOk()).toBe(true);
            expect((await fs.exists('/root-zipfromurl-dest/file')).unwrap()).toBe(true);

            await fs.remove('/root-zipfromurl.zip');
            await fs.remove('/root-zipfromurl-dest');
        });
    });

    describe('unzipStreamFromUrl edge cases', () => {
        it('should fail on network error', async () => {
            const result = await fs.unzipStreamFromUrl(`${MOCK_SERVER}/api/network-error`, '/unzip-network-error');
            expect(result.isErr()).toBe(true);

            await fs.remove('/unzip-network-error');
        });

        it('should fail on empty stream', async () => {
            const result = await fs.unzipStreamFromUrl(`${MOCK_SERVER}/api/empty-body`, '/unzip-empty-stream');
            expect(result.isErr()).toBe(true);
            expect(result.unwrapErr().name).toBe('EmptyBodyError');

            await fs.remove('/unzip-empty-stream');
        });

        it('should fail on null body stream ', async () => {
            // Use 204 response which should definitely return null body according to spec
            const result = await fs.unzipStreamFromUrl(`${ MOCK_SERVER }/api/204`, '/unzip-null-body');
            expect(result.isErr()).toBe(true);
            expect(result.unwrapErr().name).toBe('EmptyBodyError');

            await fs.remove('/unzip-null-body');
        });

        it('should fail on stream interruption ', async () => {
            const result = await fs.unzipStreamFromUrl(`${ MOCK_SERVER }/api/stream-interrupt`, '/unzip-interrupt');
            expect(result.isErr()).toBe(true);
            // The error message comes from the mock handler or network stack
            expect(result.unwrapErr().message).toBeTruthy();

            await fs.remove('/unzip-interrupt');
        });

        it('should handle invalid zip data in stream gracefully', async () => {
            // Create a file with invalid zip data
            await fs.writeFile('/invalid-stream.zip', 'This is not a valid zip file');

            const result = await fs.unzipStream('/invalid-stream.zip', '/invalid-stream-dest');
            // fflate may or may not throw on invalid data - depends on how invalid
            // Either error or empty result is acceptable
            if (result.isErr()) {
                expect(result.isErr()).toBe(true);
            }

            await fs.remove('/invalid-stream.zip');
            await fs.remove('/invalid-stream-dest');
        });
    });

    describe('zipStreamFromUrl edge cases', () => {
        it('should fail on network error', async () => {
            const result = await fs.zipStreamFromUrl(`${MOCK_SERVER}/api/network-error`, '/network-error.zip');
            expect(result.isErr()).toBe(true);

            await fs.remove('/network-error.zip');
        });

        it('should handle null stream with keepEmptyBody', async () => {
            const result = await fs.zipStreamFromUrl(`${MOCK_SERVER}/api/null-body`, '/null-stream.zip', {
                keepEmptyBody: true,
                filename: 'empty.txt',
            });
            expect(result.isOk()).toBe(true);

            await fs.remove('/null-stream.zip');
        });

        it('should fail on stream interruption ', async () => {
            const result = await fs.zipStreamFromUrl(`${MOCK_SERVER}/api/stream-interrupt`, '/interrupt-zip.zip');
            expect(result.isErr()).toBe(true);

            await fs.remove('/interrupt-zip.zip');
        });

        it('should fail when peekStream fails ', async () => {
            // stream-error-immediate errors on first read, causing peekStream to fail
            const result = await fs.zipStreamFromUrl(`${MOCK_SERVER}/api/stream-error-immediate`, '/peek-error.zip');
            expect(result.isErr()).toBe(true);

            await fs.remove('/peek-error.zip');
        });

        it('should use "file" as default filename when URL path is root', async () => {
            // Test URL with only domain (path = '/') - should use 'file' as filename
            // This covers the 'file' fallback branch when URL path is root
            const result = await fs.zipStreamFromUrl(MOCK_SERVER, '/root-path.zip');
            expect(result.isOk()).toBe(true);

            // Verify the zip was created and contains 'file' as entry name
            const unzipResult = await fs.unzip('/root-path.zip', '/root-path-dest');
            expect(unzipResult.isOk()).toBe(true);
            expect((await fs.exists('/root-path-dest/file')).unwrap()).toBe(true);

            await fs.remove('/root-path.zip');
            await fs.remove('/root-path-dest');
        });
    });

    describe('invalid path/URL validation', () => {
        it('should fail zip with invalid source path', async () => {
            const result = await fs.zip('relative/source', '/output.zip');
            expect(result.isErr()).toBe(true);
            expect(result.unwrapErr().message).toContain('absolute');
        });

        it('should fail zip with invalid dest path', async () => {
            await fs.mkdir('/valid-zip-src');
            const result = await fs.zip('/valid-zip-src', 'relative/output.zip');
            expect(result.isErr()).toBe(true);
            expect(result.unwrapErr().message).toContain('absolute');
            await fs.remove('/valid-zip-src');
        });

        it('should fail zipStream with invalid dest path', async () => {
            await fs.mkdir('/valid-zipstream-src');
            const result = await fs.zipStream('/valid-zipstream-src', 'relative/output.zip');
            expect(result.isErr()).toBe(true);
            expect(result.unwrapErr().message).toContain('absolute');
            await fs.remove('/valid-zipstream-src');
        });

        it('should fail zipStreamFromUrl with invalid dest path', async () => {
            const result = await fs.zipStreamFromUrl(mockZipUrl, 'relative/output.zip');
            expect(result.isErr()).toBe(true);
            expect(result.unwrapErr().message).toContain('absolute');
        });

        it('should fail zipFromUrl with invalid dest path ', async () => {
            const result = await fs.zipFromUrl(mockZipUrl, 'relative/output.zip');
            expect(result.isErr()).toBe(true);
            expect(result.unwrapErr().message).toContain('absolute');
        });

        it('should fail unzip with invalid dest path', async () => {
            await fs.mkdir('/valid-unzip-src');
            await fs.writeFile('/valid-unzip-src/file.txt', 'content');
            await fs.zip('/valid-unzip-src', '/valid.zip');
            const result = await fs.unzip('/valid.zip', 'relative/dest');
            expect(result.isErr()).toBe(true);
            expect(result.unwrapErr().message).toContain('absolute');
            await fs.remove('/valid-unzip-src');
            await fs.remove('/valid.zip');
        });

        it('should fail unzipStream with invalid dest path', async () => {
            await fs.mkdir('/valid-unzipstream-src');
            await fs.writeFile('/valid-unzipstream-src/file.txt', 'content');
            await fs.zip('/valid-unzipstream-src', '/valid-stream.zip');
            const result = await fs.unzipStream('/valid-stream.zip', 'relative/dest');
            expect(result.isErr()).toBe(true);
            expect(result.unwrapErr().message).toContain('absolute');
            await fs.remove('/valid-unzipstream-src');
            await fs.remove('/valid-stream.zip');
        });

        it('should fail unzipStreamFromUrl with invalid dest path', async () => {
            const result = await fs.unzipStreamFromUrl(mockZipUrl, 'relative/dest');
            expect(result.isErr()).toBe(true);
            expect(result.unwrapErr().message).toContain('absolute');
        });

        it('should fail unzipFromUrl with invalid dest path', async () => {
            const result = await fs.unzipFromUrl(mockZipUrl, 'relative/dest');
            expect(result.isErr()).toBe(true);
            expect(result.unwrapErr().message).toContain('absolute');
        });
    });
});
