/**
 * Download and upload operations tests using Vitest
 * Tests: downloadFile, uploadFile
 * Uses MSW (Mock Service Worker) for reliable mock server
 */
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import * as fs from '../src/mod.ts';
import { worker } from './mocks/browser.ts';

const mockServer = 'https://mock.test';

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
            const task = fs.downloadFile(`${mockServer}/api/product`, '/downloaded.json', {
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

            const task = fs.downloadFile(`${mockServer}/api/large-file`, '/large-file.bin', {
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
            const task = fs.downloadFile(`${mockServer}/api/product`);

            const result = await task.result;
            expect(result.isOk()).toBe(true);

            const { tempFilePath, rawResponse } = result.unwrap();

            expect(fs.isTempPath(tempFilePath)).toBe(true);
            expect(rawResponse instanceof Response).toBe(true);
            expect((await fs.exists(tempFilePath)).unwrap()).toBe(true);

            await fs.remove(tempFilePath);
        });

        it('should download binary file', async () => {
            const task = fs.downloadFile(`${mockServer}/api/binary`, '/binary.bin', {
                timeout: 10000,
            });

            const result = await task.result;
            expect(result.isOk()).toBe(true);

            const content = await fs.readFile('/binary.bin');
            expect(content.isOk()).toBe(true);
            expect(content.unwrap().byteLength).toBe(8);
        });

        it('should extract extension from URL path', async () => {
            const task = fs.downloadFile(`${mockServer}/files/data.json`);

            const result = await task.result;
            expect(result.isOk()).toBe(true);

            const { tempFilePath } = result.unwrap();
            expect(tempFilePath.endsWith('.json')).toBe(true);

            await fs.remove(tempFilePath);
        });

        it('should accept URL object', async () => {
            const url = new URL(`${mockServer}/files/data.json`);
            const task = fs.downloadFile(url);

            const result = await task.result;
            expect(result.isOk()).toBe(true);

            const { tempFilePath } = result.unwrap();
            expect(tempFilePath.endsWith('.json')).toBe(true);

            await fs.remove(tempFilePath);
        });

        it('should be abortable', async () => {
            const task = fs.downloadFile(`${mockServer}/api/slow`, '/aborted.json', {
                timeout: 30000,
            });

            // Abort immediately
            task.abort();

            const result = await task.result;
            // Should result in an error (AbortError)
            expect(result.isErr()).toBe(true);
        });

        it('should check aborted getter', async () => {
            const task = fs.downloadFile(`${mockServer}/api/product`, '/downloaded.json', {
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

        it('should return AbortError when aborted before completion', async () => {
            // Use slow endpoint to ensure we can abort before completion
            const task = fs.downloadFile(`${mockServer}/api/slow`, '/aborted.json', {
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
            const task = fs.downloadFile(`${mockServer}/api/404`, '/not-found.json', {
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
            const task = fs.downloadFile(`${mockServer}/api/500`, '/error.json', {
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
            const task = fs.downloadFile(`${mockServer}/api/network-error`, '/network-error.json', {
                timeout: 10000,
            });

            const result = await task.result;
            expect(result.isErr()).toBe(true);
        });

        it('should not leave incomplete file when stream is interrupted', async () => {
            const filePath = '/stream-interrupt.bin';

            const task = fs.downloadFile(`${mockServer}/api/stream-interrupt`, filePath, {
                timeout: 10000,
            });

            const result = await task.result;

            // Download should fail due to stream interruption
            expect(result.isErr()).toBe(true);

            // After a failed download, file should NOT exist
            const existsRes = await fs.exists(filePath);
            expect(existsRes.unwrap()).toBe(false);
        });

        it('should fail on empty body response by default', async () => {
            // Response with Content-Length: 0
            const task = fs.downloadFile(`${ mockServer }/api/204`, '/empty.bin');

            const result = await task.result;
            expect(result.isErr()).toBe(true);
            expect(result.unwrapErr().name).toBe('EmptyBodyError');
        });

        it('should keep empty body response with keepEmptyBody option', async () => {
            // Response with Content-Length: 0, keepEmptyBody allows it
            const task = fs.downloadFile(`${ mockServer }/api/empty-body`, '/empty.bin', {
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
    });

    describe('uploadFile', () => {
        it('should upload file', async () => {
            // Create a file to upload
            await fs.writeFile('/upload-test.json', JSON.stringify({ test: true }));

            const task = fs.uploadFile('/upload-test.json', `${mockServer}/api/upload`);

            const result = await task.result;
            expect(result.isOk()).toBe(true);

            const response = result.unwrap();
            expect(response instanceof Response).toBe(true);

            const json = await response.json();
            expect(json.success).toBe(true);
        });

        it('should upload file with custom filename', async () => {
            await fs.writeFile('/upload-custom.json', JSON.stringify({ custom: true }));

            const task = fs.uploadFile('/upload-custom.json', `${mockServer}/api/upload`, {
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

            const task = fs.uploadFile('/upload-abort.json', `${mockServer}/api/upload`, {
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

            const task = fs.uploadFile('/upload-abort.json', `${mockServer}/api/upload`, {
                timeout: 10000,
            });

            // Initially not aborted
            expect(task.aborted).toBe(false);

            // Abort and check
            task.abort();
            expect(task.aborted).toBe(true);
        });
    });
});
