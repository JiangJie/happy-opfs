/**
 * Mock tests for src/async/transfer/download.ts
 * Covers the null body branch (line 118-120)
 */
import type { FetchInit } from '@happy-ts/fetch-t';
import { afterEach, describe, expect, it, vi } from 'vitest';

// Mock fetchT to return response with null body
let mockFetchTReturnNullBody = false;

vi.mock('@happy-ts/fetch-t', async (importOriginal) => {
    const original = await importOriginal<typeof import('@happy-ts/fetch-t')>();
    const { Ok } = await import('happy-rusty');
    return {
        ...original,
        fetchT: (url: string | URL, options?: FetchInit) => {
            if (mockFetchTReturnNullBody && options?.abortable === true) {
                // Return a FetchTask with response that has null body
                const mockResponse = {
                    body: null,
                    ok: true,
                    status: 204,
                } as Response;

                return {
                    abort: () => {},
                    aborted: false,
                    result: Promise.resolve(Ok(mockResponse)),
                };
            }
            return original.fetchT(url, options);
        },
    };
});

// Import after mock setup
const { downloadFile } = await import('../src/async/transfer/download.ts');
const { mkdir, remove } = await import('../src/async/core/mod.ts');
const { exists } = await import('../src/async/ext.ts');
const { EMPTY_BODY_ERROR } = await import('../src/shared/constants.ts');

describe('download.ts null body handling', () => {
    afterEach(async () => {
        mockFetchTReturnNullBody = false;
        await remove('/download-mock-test');
    });

    it('should return error when body is null and keepEmptyBody is false (line 118-120)', async () => {
        await mkdir('/download-mock-test');

        // Enable mock to return null body
        mockFetchTReturnNullBody = true;

        const task = downloadFile('https://mock.test/file.bin', '/download-mock-test/test.bin');
        const result = await task.result;

        expect(result.isErr()).toBe(true);
        expect(result.unwrapErr().name).toBe(EMPTY_BODY_ERROR);
    });

    it('should create empty file when body is null and keepEmptyBody is true (line 118-120)', async () => {
        await mkdir('/download-mock-test');

        // Enable mock to return null body
        mockFetchTReturnNullBody = true;

        const task = downloadFile('https://mock.test/file.bin', '/download-mock-test/test.bin', {
            keepEmptyBody: true,
        });
        const result = await task.result;

        expect(result.isOk()).toBe(true);

        // Verify empty file was created
        const existsRes = await exists('/download-mock-test/test.bin', { isFile: true });
        expect(existsRes.isOk()).toBe(true);
        expect(existsRes.unwrap()).toBe(true);
    });
});
