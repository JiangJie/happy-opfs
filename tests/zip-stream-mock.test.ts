/**
 * Mock tests for src/async/archive/zip-stream.ts
 * Covers the null stream handling when fetchT returns empty body.
 */
import type { FetchInit } from '@happy-ts/fetch-t';
import { afterEach, describe, expect, it, vi } from 'vitest';

// Mock fetchT to return null stream
let mockFetchTReturnNull = false;

vi.mock('@happy-ts/fetch-t', async (importOriginal) => {
    const original = await importOriginal<typeof import('@happy-ts/fetch-t')>();
    const { Ok } = await import('happy-rusty');
    return {
        ...original,
        fetchT: async (url: string | URL, options?: FetchInit) => {
            if (mockFetchTReturnNull && options?.responseType === 'stream') {
                // Return Ok(null) to simulate 204/304 response body
                return Ok(null);
            }
            return original.fetchT(url, options);
        },
    };
});

// Import after mock setup
const { zipStreamFromUrl } = await import('../src/async/archive/zip-stream.ts');
const { mkdir, remove } = await import('../src/async/core/mod.ts');
const { EMPTY_BODY_ERROR } = await import('../src/shared/constants.ts');

describe('zip-stream.ts null stream handling', () => {
    afterEach(async () => {
        mockFetchTReturnNull = false;
        await remove('/zip-stream-mock-test');
    });

    it('should return error when stream is null and keepEmptyBody is false', async () => {
        await mkdir('/zip-stream-mock-test');

        // Enable mock to return null stream
        mockFetchTReturnNull = true;

        const result = await zipStreamFromUrl('https://mock.test/file.bin', '/zip-stream-mock-test/test.zip');
        expect(result.isErr()).toBe(true);
        expect(result.unwrapErr().name).toBe(EMPTY_BODY_ERROR);
    });

    it('should create empty zip when stream is null and keepEmptyBody is true', async () => {
        await mkdir('/zip-stream-mock-test');

        // Enable mock to return null stream
        mockFetchTReturnNull = true;

        const result = await zipStreamFromUrl('https://mock.test/file.bin', '/zip-stream-mock-test/test.zip', {
            keepEmptyBody: true,
        });
        expect(result.isOk()).toBe(true);
    });
});
