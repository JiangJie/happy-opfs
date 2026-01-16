/**
 * Mock tests for src/async/archive/unzip-stream.ts
 * Covers the null stream branch (line 106)
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { FileEncoding } from '../src/mod.ts';

// Mock readFile to return null stream
let mockReadFileReturnNull = false;

vi.mock('../src/async/core/read.ts', async (importOriginal) => {
    const original = await importOriginal<typeof import('../src/async/core/read.ts')>();
    const { Ok } = await import('happy-rusty');
    return {
        ...original,
        readFile: async (path: string, options?: { encoding?: FileEncoding; }) => {
            if (mockReadFileReturnNull && options?.encoding === 'stream') {
                // Return Ok(null) to simulate 204/304 response body
                return Ok(null);
            }
            return original.readFile(path, options);
        },
    };
});

// Import after mock setup
const { unzipStream } = await import('../src/async/archive/unzip-stream.ts');
const { mkdir, writeFile, remove } = await import('../src/async/core/mod.ts');
const { EMPTY_FILE_ERROR } = await import('../src/shared/constants.ts');

describe('unzip-stream.ts null stream handling', () => {
    afterEach(async () => {
        mockReadFileReturnNull = false;
        await remove('/unzip-stream-mock-test');
    });

    it('should return error when stream is null (line 106)', async () => {
        // Create a dummy zip file (content doesn't matter, we'll mock the stream)
        await mkdir('/unzip-stream-mock-test');
        await writeFile('/unzip-stream-mock-test/test.zip', 'dummy');

        // Enable mock to return null stream
        mockReadFileReturnNull = true;

        const result = await unzipStream('/unzip-stream-mock-test/test.zip', '/unzip-stream-mock-test/dest');
        expect(result.isErr()).toBe(true);
        expect(result.unwrapErr().name).toBe(EMPTY_FILE_ERROR);
    });
});
