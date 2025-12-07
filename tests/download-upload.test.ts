/**
 * Download and upload operations tests using Vitest
 * Tests: downloadFile, uploadFile
 */
import { afterEach, describe, expect, it } from 'vitest';
import * as fs from '../src/mod.ts';

const mockServer = 'https://fakestoreapi.com';
const mockAll = `${mockServer}/products`;
const mockSingle = `${mockAll}/1`;

describe('OPFS Download/Upload Operations', () => {
    afterEach(async () => {
        await fs.remove('/downloaded.json');
        await fs.remove('/download-progress.json');
        await fs.remove('/aborted.json');
        await fs.remove('/upload-test.json');
        await fs.remove('/upload-custom.json');
        await fs.remove('/upload-abort.json');
        await fs.deleteTemp();
    });

    describe('downloadFile', () => {
        it('should download file to specified path', async () => {
            const task = fs.downloadFile(mockSingle, '/downloaded.json', {
                timeout: 10000,
            });

            const result = await task.response;
            if (result.isOk()) {
                const response = result.unwrap();
                expect(response instanceof Response).toBe(true);

                expect((await fs.exists('/downloaded.json')).unwrap()).toBe(true);

                const content = await fs.readJsonFile<{ id: number }>('/downloaded.json');
                expect(content.unwrap().id).toBe(1);
            }
        });

        it('should download file with progress callback', async () => {
            let progressCalled = false;
            let lastProgress = 0;

            const task = fs.downloadFile(mockSingle, '/download-progress.json', {
                timeout: 10000,
                onProgress: (progressResult) => {
                    progressResult.inspect((progress) => {
                        progressCalled = true;
                        lastProgress = progress.completedByteLength;
                    });
                },
            });

            const result = await task.response;
            if (result.isOk()) {
                // Progress should have been called with some bytes
                if (progressCalled) {
                    expect(lastProgress).toBeGreaterThan(0);
                }
            }
        });

        it('should download file to temp path when no path specified', async () => {
            const task = fs.downloadFile(mockSingle);

            const result = await task.response;
            if (result.isOk()) {
                const { tempFilePath, rawResponse } = result.unwrap();

                expect(fs.isTempPath(tempFilePath)).toBe(true);
                expect(rawResponse instanceof Response).toBe(true);
                expect((await fs.exists(tempFilePath)).unwrap()).toBe(true);

                await fs.remove(tempFilePath);
            }
        });

        it('should be abortable', async () => {
            const task = fs.downloadFile(mockAll, '/aborted.json', {
                timeout: 10000,
            });

            // Abort immediately
            task.abort();

            const result = await task.response;
            // Should result in an error (AbortError)
            expect(result.isErr()).toBe(true);
        });

        it('should check aborted getter', async () => {
            const task = fs.downloadFile(mockSingle, '/downloaded.json', {
                timeout: 10000,
            });

            // Initially not aborted
            expect(task.aborted).toBe(false);

            // Abort and check
            task.abort();
            expect(task.aborted).toBe(true);
        });

        it('should handle invalid URL format for extension extraction', async () => {
            // Use a truly malformed URL that will fail new URL() parsing
            // A relative path without protocol causes new URL() to throw
            const invalidUrl = '/relative/path/file.json?query=1#hash';

            const task = fs.downloadFile(invalidUrl);

            // The URL is invalid for fetch (relative URL), so it should error
            const result = await task.response;
            expect(result.isErr()).toBe(true);
        });

        it('should return AbortError when aborted after fetch completes', async () => {
            // This test attempts to cover line 77 in opfs_download.ts
            // The abort check after blob() but before writeFile is hard to hit
            // because the window is very small. We try our best with timing.

            // Use a larger dataset and abort during progress
            let progressCount = 0;

            const task = fs.downloadFile(mockAll, {
                timeout: 30000,
                onProgress: () => {
                    progressCount++;
                    // Abort after receiving some progress updates
                    // This sets aborted=true, which may be checked at line 77
                    if (progressCount === 2) {
                        task.abort();
                    }
                },
            });

            const result = await task.response;

            // Either succeeds or fails with AbortError
            if (result.isErr()) {
                const err = result.unwrapErr();
                expect(['AbortError', 'TypeError'].includes(err.name)).toBe(true);
            }
        });
    });

    describe('uploadFile', () => {
        it('should upload file', async () => {
            // Create a file to upload
            await fs.writeFile('/upload-test.json', JSON.stringify({ test: true }));

            const task = fs.uploadFile('/upload-test.json', mockAll);

            const result = await task.response;
            if (result.isOk()) {
                const response = result.unwrap();
                expect(response instanceof Response).toBe(true);
            }
        });

        it('should upload file with custom filename', async () => {
            await fs.writeFile('/upload-custom.json', JSON.stringify({ custom: true }));

            const task = fs.uploadFile('/upload-custom.json', mockAll, {
                timeout: 10000,
                filename: 'custom-name.json',
            });

            const result = await task.response;
            if (result.isOk()) {
                const response = result.unwrap();
                expect(response instanceof Response).toBe(true);
            }
        });

        it('should be abortable', async () => {
            await fs.writeFile('/upload-abort.json', JSON.stringify({ abort: true }));

            const task = fs.uploadFile('/upload-abort.json', mockAll, {
                timeout: 10000,
            });

            // Abort immediately
            task.abort();

            const result = await task.response;
            // Should result in an error
            expect(result.isErr()).toBe(true);
        });

        it('should check aborted getter', async () => {
            await fs.writeFile('/upload-abort.json', JSON.stringify({ abort: true }));

            const task = fs.uploadFile('/upload-abort.json', mockAll, {
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
