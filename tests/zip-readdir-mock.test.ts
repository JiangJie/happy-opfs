/**
 * Test for zip and zip-stream readDir error handling using vitest mocking.
 * Covers readDir error and async iterator error scenarios in zip operations.
 */
import { Err, Ok } from 'happy-rusty';
import { afterEach, describe, expect, it, vi } from 'vitest';

// Flag to control mock behavior
let mockReadDirShouldFail = false;
let mockIteratorShouldFail = false;

// Mock the read module to make readDir fail
vi.mock('../src/async/core/read.ts', async (importOriginal) => {
    const original = await importOriginal<typeof import('../src/async/core/read.ts')>();
    return {
        ...original,
        readDir: (path: string, options?: { recursive?: boolean; }) => {
            if (mockReadDirShouldFail) {
                return Promise.resolve(Err(new Error('Mocked readDir error')));
            }
            if (mockIteratorShouldFail) {
                // Return an async generator that throws on first next()
                // eslint-disable-next-line require-yield
                const failingGenerator = (async function* () {
                    throw new Error('Mocked iterator error');
                })();
                return Promise.resolve(Ok(failingGenerator));
            }
            return original.readDir(path, options);
        },
    };
});

// Import fs after mocking
const fs = await import('../src/mod.ts');

describe('zip-stream readDir error handling', () => {
    afterEach(async () => {
        mockReadDirShouldFail = false;
        mockIteratorShouldFail = false;
        await fs.remove('/mock-readdir-src');
        await fs.remove('/mock-readdir.zip');
    });

    it('should handle readDir error in zipStream', async () => {
        // Create a directory first (stat will succeed)
        await fs.mkdir('/mock-readdir-src');

        // Enable mock failure
        mockReadDirShouldFail = true;

        const result = await fs.zipStream('/mock-readdir-src', '/mock-readdir.zip');

        expect(result.isErr()).toBe(true);
        expect(result.unwrapErr().message).toBe('Mocked readDir error');
    });

    it('should handle async iterator error in zipStream', async () => {
        // Create a directory first (stat will succeed)
        await fs.mkdir('/mock-readdir-src');

        // Enable mock iterator failure
        mockIteratorShouldFail = true;

        const result = await fs.zipStream('/mock-readdir-src', '/mock-readdir.zip');

        expect(result.isErr()).toBe(true);
        expect(result.unwrapErr().message).toBe('Mocked iterator error');
    });
});

describe('zip readDir error handling', () => {
    afterEach(async () => {
        mockReadDirShouldFail = false;
        mockIteratorShouldFail = false;
        await fs.remove('/mock-zip-src');
        await fs.remove('/mock-zip.zip');
    });

    it('should handle readDir error in zip', async () => {
        // Create a directory first (stat will succeed)
        await fs.mkdir('/mock-zip-src');

        // Enable mock failure
        mockReadDirShouldFail = true;

        const result = await fs.zip('/mock-zip-src', '/mock-zip.zip');

        expect(result.isErr()).toBe(true);
        expect(result.unwrapErr().message).toBe('Mocked readDir error');
    });

    it('should handle for-await loop error in zip', async () => {
        // Create a directory first (stat will succeed)
        await fs.mkdir('/mock-zip-src');

        // Enable mock iterator failure
        mockIteratorShouldFail = true;

        const result = await fs.zip('/mock-zip-src', '/mock-zip.zip');

        expect(result.isErr()).toBe(true);
        expect(result.unwrapErr().message).toBe('Mocked iterator error');
    });
});
