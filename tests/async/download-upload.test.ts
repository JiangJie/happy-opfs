/**
 * Tests for download and upload operations
 */
import * as fs from '../../src/mod.ts';
import { mockAll, mockSingle } from '../constants.ts';
import { assert, assertEqual, assertOk, describe, test } from '../test-utils.ts';

export async function testDownloadUpload(): Promise<void> {
    await describe('Download - downloadFile', async () => {
        await test('should download file to specified path', async () => {
            const task = fs.downloadFile(mockSingle, '/downloaded.json', {
                timeout: 5000,
            });

            const result = await task.response;
            if (result.isOk()) {
                const response = result.unwrap();
                assert(response instanceof Response);

                assert(assertOk(await fs.exists('/downloaded.json')));

                const content = await fs.readJsonFile<{ id: number }>('/downloaded.json');
                assertEqual(assertOk(content).id, 1);

                await fs.remove('/downloaded.json');
            }
        });

        await test('should download file with progress callback', async () => {
            let progressCalled = false;
            let lastProgress = 0;

            const task = fs.downloadFile(mockSingle, '/download-progress.json', {
                timeout: 5000,
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
                    assert(lastProgress > 0);
                }

                await fs.remove('/download-progress.json');
            }
        });

        await test('should download file to temp path when no path specified', async () => {
            const task = fs.downloadFile(mockSingle);

            const result = await task.response;
            if (result.isOk()) {
                const { tempFilePath, rawResponse } = result.unwrap();

                assert(fs.isTempPath(tempFilePath));
                assert(rawResponse instanceof Response);
                assert(assertOk(await fs.exists(tempFilePath)));

                await fs.remove(tempFilePath);
            }
        });

        await test('should be abortable', async () => {
            const task = fs.downloadFile(mockAll, '/aborted.json', {
                timeout: 5000,
            });

            // Abort immediately
            task.abort();

            const result = await task.response;
            // Should result in an error (AbortError)
            assert(result.isErr());
        });
    });

    await describe('Upload - uploadFile', async () => {
        await test('should upload file', async () => {
            // Create a file to upload
            await fs.writeFile('/upload-test.json', JSON.stringify({ test: true }));

            const task = fs.uploadFile('/upload-test.json', mockAll, {
                timeout: 5000,
            });

            const result = await task.response;
            if (result.isOk()) {
                const response = result.unwrap();
                assert(response instanceof Response);
            }

            await fs.remove('/upload-test.json');
        });

        await test('should upload file with custom filename', async () => {
            await fs.writeFile('/upload-custom.json', JSON.stringify({ custom: true }));

            const task = fs.uploadFile('/upload-custom.json', mockAll, {
                timeout: 5000,
                filename: 'custom-name.json',
            });

            const result = await task.response;
            if (result.isOk()) {
                const response = result.unwrap();
                assert(response instanceof Response);
            }

            await fs.remove('/upload-custom.json');
        });

        await test('should be abortable', async () => {
            await fs.writeFile('/upload-abort.json', JSON.stringify({ abort: true }));

            const task = fs.uploadFile('/upload-abort.json', mockAll, {
                timeout: 5000,
            });

            // Abort immediately
            task.abort();

            const result = await task.response;
            // Should result in an error
            assert(result.isErr());

            await fs.remove('/upload-abort.json');
        });
    });
}
