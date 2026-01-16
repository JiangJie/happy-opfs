/**
 * Mock tests for src/async/ext.ts
 * Covers the readDir error branch in copy/move operations.
 */
import { Err } from 'happy-rusty';
import { afterEach, describe, expect, it, vi } from 'vitest';

// Mock readDir to fail after stat succeeds
let mockReadDirShouldFail = false;
// Mock readDir to return an iterator that throws during iteration
let mockIteratorShouldThrow = false;

vi.mock('../src/async/core/read.ts', async (importOriginal) => {
    const original = await importOriginal<typeof import('../src/async/core/read.ts')>();
    const { Ok } = await import('happy-rusty');
    return {
        ...original,
        readDir: async (path: string, options?: { recursive?: boolean; }) => {
            if (mockReadDirShouldFail) {
                return Err(new Error('Mocked readDir error after stat'));
            }
            if (mockIteratorShouldThrow) {
                // Return an async iterator that throws during iteration
                const throwingIterator: AsyncIterable<{ path: string; handle: FileSystemHandle; }> = {
                    [Symbol.asyncIterator]() {
                        return {
                            async next() {
                                throw new Error('Iterator error during traversal');
                            },
                        };
                    },
                };
                return Ok(throwingIterator);
            }
            return original.readDir(path, options);
        },
    };
});

// Import after mock setup
const { copy, move } = await import('../src/async/ext.ts');
const { mkdir, writeFile, remove } = await import('../src/async/core/mod.ts');

describe('ext.ts copy/move readDir error handling', () => {
    afterEach(async () => {
        mockReadDirShouldFail = false;
        mockIteratorShouldThrow = false;
        await remove('/ext-mock-test');
    });

    it('should handle readDir error in copy', async () => {
        // Create source directory
        await mkdir('/ext-mock-test/src');
        await writeFile('/ext-mock-test/src/file.txt', 'content');

        // Enable mock to fail readDir
        mockReadDirShouldFail = true;

        const result = await copy('/ext-mock-test/src', '/ext-mock-test/dest');
        expect(result.isErr()).toBe(true);
        expect(result.unwrapErr().message).toBe('Mocked readDir error after stat');
    });

    it('should handle readDir error in move', async () => {
        // Create source directory
        await mkdir('/ext-mock-test/src');
        await writeFile('/ext-mock-test/src/file.txt', 'content');

        // Enable mock to fail readDir
        mockReadDirShouldFail = true;

        const result = await move('/ext-mock-test/src', '/ext-mock-test/dest');
        expect(result.isErr()).toBe(true);
        expect(result.unwrapErr().message).toBe('Mocked readDir error after stat');
    });

    it('should handle iterator error during directory traversal', async () => {
        // Create source directory
        await mkdir('/ext-mock-test/src');
        await writeFile('/ext-mock-test/src/file.txt', 'content');

        // Enable mock to throw during iteration
        mockIteratorShouldThrow = true;

        const result = await copy('/ext-mock-test/src', '/ext-mock-test/dest');
        expect(result.isErr()).toBe(true);
        expect(result.unwrapErr().message).toBe('Iterator error during traversal');
    });
});
