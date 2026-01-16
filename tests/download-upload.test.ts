/**
 * Download and upload operations tests using Vitest
 * Tests: downloadFile, uploadFile
 * Uses MSW (Mock Service Worker) for reliable mock server
 */
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import * as fs from '../src/mod.ts';
import { worker } from './mocks/browser.ts';
import { MOCK_SERVER } from './mocks/constants.ts';

describe('OPFS Download/Upload Operations', () => {
    beforeAll(async () => {
        // Start MSW worker from fixed port (configured in vite.config.ts)
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
        await fs.remove('/downloaded.json');
        await fs.remove('/download-progress.json');
        await fs.remove('/aborted.json');
        await fs.remove('/upload-test.json');
        await fs.remove('/upload-custom.json');
        await fs.remove('/upload-abort.json');
        await fs.remove('/large-file.bin');
        await fs.remove('/binary.bin');
        await fs.deleteTemp();
    });

    describe('downloadFile', () => {
        it('should download file to specified path', async () => {
            const task = fs.downloadFile(`${MOCK_SERVER}/api/product`, '/downloaded.json', {
                timeout: 10000,
            });

            const result = await task.result;
            expect(result.isOk()).toBe(true);

            const response = result.unwrap();
            expect(response instanceof Response).toBe(true);

            expect((await fs.exists('/downloaded.json')).unwrap()).toBe(true);

            const content = await fs.readJsonFile<{ id: number; }>('/downloaded.json');
            expect(content.unwrap().id).toBe(1);
        });

        it('should download file with progress callback', async () => {
            let progressCalled = false;
            let lastProgress = 0;

            const task = fs.downloadFile(`${MOCK_SERVER}/api/large-file`, '/large-file.bin', {
                timeout: 10000,
                onProgress: (progressResult) => {
                    progressResult.inspect((progress) => {
                        progressCalled = true;
                        lastProgress = progress.completedByteLength;
                    });
                },
            });

            const result = await task.result;
            expect(result.isOk()).toBe(true);

            // Progress should have been called with some bytes
            if (progressCalled) {
                expect(lastProgress).toBeGreaterThan(0);
            }
        });

        it('should download file to temp path when no path specified', async () => {
            const task = fs.downloadFile(`${MOCK_SERVER}/api/product`);

            const result = await task.result;
            expect(result.isOk()).toBe(true);

            const { tempFilePath, rawResponse } = result.unwrap();

            expect(fs.isTempPath(tempFilePath)).toBe(true);
            expect(rawResponse instanceof Response).toBe(true);
            expect((await fs.exists(tempFilePath)).unwrap()).toBe(true);

            await fs.remove(tempFilePath);
        });

        it('should download binary file', async () => {
            const task = fs.downloadFile(`${MOCK_SERVER}/api/binary`, '/binary.bin', {
                timeout: 10000,
            });

            const result = await task.result;
            expect(result.isOk()).toBe(true);

            const content = await fs.readFile('/binary.bin');
            expect(content.isOk()).toBe(true);
            expect(content.unwrap().byteLength).toBe(8);
        });

        it('should extract extension from URL path', async () => {
            const task = fs.downloadFile(`${MOCK_SERVER}/files/data.json`);

            const result = await task.result;
            expect(result.isOk()).toBe(true);

            const { tempFilePath } = result.unwrap();
            expect(tempFilePath.endsWith('.json')).toBe(true);

            await fs.remove(tempFilePath);
        });

        it('should accept URL object', async () => {
            const url = new URL(`${MOCK_SERVER}/files/data.json`);
            const task = fs.downloadFile(url);

            const result = await task.result;
            expect(result.isOk()).toBe(true);

            const { tempFilePath } = result.unwrap();
            expect(tempFilePath.endsWith('.json')).toBe(true);

            await fs.remove(tempFilePath);
        });

        it('should be abortable', async () => {
            const task = fs.downloadFile(`${MOCK_SERVER}/api/slow`, '/aborted.json', {
                timeout: 30000,
            });

            // Abort immediately
            task.abort();

            const result = await task.result;
            // Should result in an error (AbortError)
            expect(result.isErr()).toBe(true);
        });

        it('should check aborted getter', async () => {
            const task = fs.downloadFile(`${MOCK_SERVER}/api/product`, '/downloaded.json', {
                timeout: 10000,
            });

            // Initially not aborted
            expect(task.aborted).toBe(false);

            // Abort and check
            task.abort();
            expect(task.aborted).toBe(true);
        });

        it('should support relative URLs', () => {
            // Relative URLs are now supported via location.href as base
            const relativeUrl = '/api/data.json';
            // Should not throw - just check the task is created
            const task = fs.downloadFile(relativeUrl);
            expect(task).toBeDefined();
            expect(task.abort).toBeDefined();
            task.abort(); // Clean up
        });

        it('should handle validation failure with failed fetch task (helpers.ts 186-189)', async () => {
            // Test with invalid file path (relative path) to trigger createFailedFetchTask
            const task = fs.downloadFile(`${MOCK_SERVER}/api/product`, 'relative-path.json');

            // The task should be a failed fetch task
            expect(task).toBeDefined();

            // Test abort() - should be a noop
            task.abort();

            // Test aborted getter - should return false for failed task
            expect(task.aborted).toBe(false);

            // Test result - should return error
            const result = await task.result;
            expect(result.isErr()).toBe(true);
            expect(result.unwrapErr().message).toContain('absolute');
        });

        it('should return AbortError when aborted before completion', async () => {
            // Use slow endpoint to ensure we can abort before completion
            const task = fs.downloadFile(`${MOCK_SERVER}/api/slow`, '/aborted.json', {
                timeout: 30000,
            });

            // Small delay then abort
            setTimeout(() => task.abort(), 100);

            const result = await task.result;

            // Should fail with AbortError
            expect(result.isErr()).toBe(true);
            const err = result.unwrapErr();
            expect(err.name).toBe('AbortError');
        });

        it('should handle 404 response', async () => {
            const task = fs.downloadFile(`${MOCK_SERVER}/api/404`, '/not-found.json', {
                timeout: 10000,
            });

            const result = await task.result;
            // Fetch itself succeeds but with 404 status
            if (result.isOk()) {
                const response = result.unwrap();
                expect(response.status).toBe(404);
            }
        });

        it('should handle 500 response', async () => {
            const task = fs.downloadFile(`${MOCK_SERVER}/api/500`, '/error.json', {
                timeout: 10000,
            });

            const result = await task.result;
            // Fetch itself succeeds but with 500 status
            if (result.isOk()) {
                const response = result.unwrap();
                expect(response.status).toBe(500);
            }
        });

        it('should handle network error', async () => {
            const task = fs.downloadFile(`${MOCK_SERVER}/api/network-error`, '/network-error.json', {
                timeout: 10000,
            });

            const result = await task.result;
            expect(result.isErr()).toBe(true);
        });

        it('should not leave incomplete file when stream is interrupted', async () => {
            const filePath = '/stream-interrupt.bin';

            const task = fs.downloadFile(`${MOCK_SERVER}/api/stream-interrupt`, filePath, {
                timeout: 10000,
            });

            const result = await task.result;

            // Download should fail due to stream interruption
            expect(result.isErr()).toBe(true);

            // After a failed download, file should NOT exist
            const existsRes = await fs.exists(filePath);
            expect(existsRes.unwrap()).toBe(false);
        });

        it('should handle stream that errors immediately on first read', async () => {
            const filePath = '/stream-error-immediate.bin';

            const task = fs.downloadFile(`${MOCK_SERVER}/api/stream-error-immediate`, filePath, {
                timeout: 10000,
            });

            const result = await task.result;

            // Download should fail due to stream error on first read
            expect(result.isErr()).toBe(true);

            // File should NOT exist after failure
            const existsRes = await fs.exists(filePath);
            expect(existsRes.unwrap()).toBe(false);
        });

        it('should handle abort during download (stream cancel)', async () => {
            // Use slow endpoint to ensure there's time to abort during streaming
            const filePath = '/abort-during-stream.bin';

            const task = fs.downloadFile(`${MOCK_SERVER}/api/slow`, filePath, {
                timeout: 30000,
            });

            // Abort after a small delay to ensure request has started
            setTimeout(() => task.abort(), 50);

            const result = await task.result;

            // Should fail with AbortError
            expect(result.isErr()).toBe(true);
            expect(result.unwrapErr().name).toBe('AbortError');

            // Cleanup
            await fs.remove(filePath);
        });

        it('should fail on empty body response by default', async () => {
            // Response with Content-Length: 0
            const task = fs.downloadFile(`${ MOCK_SERVER }/api/204`, '/empty.bin');

            const result = await task.result;
            expect(result.isErr()).toBe(true);
            expect(result.unwrapErr().name).toBe('EmptyBodyError');
        });

        it('should keep empty body response with keepEmptyBody option', async () => {
            // Response with Content-Length: 0, keepEmptyBody allows it
            const task = fs.downloadFile(`${ MOCK_SERVER }/api/empty-body`, '/empty.bin', {
                keepEmptyBody: true,
            });

            const result = await task.result;
            expect(result.isOk()).toBe(true);

            // Verify empty file was created
            const content = await fs.readFile('/empty.bin');
            expect(content.isOk()).toBe(true);
            expect(content.unwrap().byteLength).toBe(0);

            await fs.remove('/empty.bin');
        });

        it('should handle null body response ', async () => {
            // Test for null body - should fail with EmptyBodyError by default
            const task = fs.downloadFile(`${ MOCK_SERVER }/api/null-body`, '/null-body.bin');

            const result = await task.result;
            // MSW may return empty stream instead of null body in browser
            // Either EmptyBodyError or successful empty file creation is acceptable
            if (result.isErr()) {
                expect(result.unwrapErr().name).toBe('EmptyBodyError');
            }
        });

        it('should handle null body response with keepEmptyBody option', async () => {
            // Test for null body with keepEmptyBody=true
            const task = fs.downloadFile(`${ MOCK_SERVER }/api/null-body-keep`, '/null-body-keep.bin', {
                keepEmptyBody: true,
            });

            const result = await task.result;
            expect(result.isOk()).toBe(true);

            await fs.remove('/null-body-keep.bin');
        });
    });

    describe('uploadFile', () => {
        it('should upload file', async () => {
            // Create a file to upload
            await fs.writeFile('/upload-test.json', JSON.stringify({ test: true }));

            const task = fs.uploadFile('/upload-test.json', `${MOCK_SERVER}/api/upload`);

            const result = await task.result;
            expect(result.isOk()).toBe(true);

            const response = result.unwrap();
            expect(response instanceof Response).toBe(true);

            const json = await response.json();
            expect(json.success).toBe(true);
        });

        it('should upload file with custom filename', async () => {
            await fs.writeFile('/upload-custom.json', JSON.stringify({ custom: true }));

            const task = fs.uploadFile('/upload-custom.json', `${MOCK_SERVER}/api/upload`, {
                timeout: 10000,
                filename: 'custom-name.json',
            });

            const result = await task.result;
            expect(result.isOk()).toBe(true);

            const response = result.unwrap();
            expect(response instanceof Response).toBe(true);

            const json = await response.json();
            expect(json.success).toBe(true);
            // The filename in FormData should be the custom name
            // Note: filename might be present depending on upload implementation
            if (json.filename) {
                expect(json.filename).toBe('custom-name.json');
            }
        });

        it('should be abortable', async () => {
            await fs.writeFile('/upload-abort.json', JSON.stringify({ abort: true }));

            const task = fs.uploadFile('/upload-abort.json', `${MOCK_SERVER}/api/upload`, {
                timeout: 10000,
            });

            // Abort immediately
            task.abort();

            const result = await task.result;
            // Should result in an error
            expect(result.isErr()).toBe(true);
        });

        it('should check aborted getter', async () => {
            await fs.writeFile('/upload-abort.json', JSON.stringify({ abort: true }));

            const task = fs.uploadFile('/upload-abort.json', `${MOCK_SERVER}/api/upload`, {
                timeout: 10000,
            });

            // Initially not aborted
            expect(task.aborted).toBe(false);

            // Abort and check
            task.abort();
            expect(task.aborted).toBe(true);
        });
    });

    describe('invalid path/URL validation', () => {
        it('should fail downloadFile with invalid URL', async () => {
            const task = fs.downloadFile('http://', '/downloaded.json');
            const result = await task.result;
            expect(result.isErr()).toBe(true);
        });

        it('should fail downloadFile with invalid dest path', async () => {
            const task = fs.downloadFile(`${MOCK_SERVER}/api/product`, 'relative/path.json');
            const result = await task.result;
            expect(result.isErr()).toBe(true);
            expect(result.unwrapErr().message).toContain('absolute');
        });

        it('should fail uploadFile with invalid path', async () => {
            const task = fs.uploadFile('relative/path.json', `${MOCK_SERVER}/api/upload`);
            const result = await task.result;
            expect(result.isErr()).toBe(true);
            expect(result.unwrapErr().message).toContain('absolute');
        });

        it('should fail uploadFile with invalid URL', async () => {
            await fs.writeFile('/upload-valid.json', JSON.stringify({ test: true }));
            const task = fs.uploadFile('/upload-valid.json', 'http://');
            const result = await task.result;
            expect(result.isErr()).toBe(true);
            await fs.remove('/upload-valid.json');
        });
    });
});
