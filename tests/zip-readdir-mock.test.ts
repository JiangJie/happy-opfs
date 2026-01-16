/**
 * Test for zip and zip-stream readDir error handling using vitest mocking.
 * Covers readDir error, async iterator error, and file read error scenarios in zip operations.
 */
import { Err, Ok } from 'happy-rusty';
import { afterEach, describe, expect, it, vi } from 'vitest';

// Flags to control mock behavior
let mockReadDirShouldFail = false;
let mockIteratorShouldFail = false;
let mockFileReadShouldFail = false;

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
            if (mockFileReadShouldFail) {
                // Return an async generator with a file that will fail to read
                const failingFileGenerator = (async function* () {
                    yield {
                        path: 'test.txt',
                        handle: {
                            kind: 'file',
                            name: 'test.txt',
                            getFile: () => Promise.reject(new Error('Mocked file read error')),
                        } as FileSystemFileHandle,
                    };
                })();
                return Promise.resolve(Ok(failingFileGenerator));
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
        mockFileReadShouldFail = false;
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
        mockFileReadShouldFail = false;
        await fs.remove('/mock-zip-src');
        await fs.remove('/mock-zip.zip');
        await fs.remove('/mock-task-src');
        await fs.remove('/mock-task.zip');
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

    it('should handle file read task error in zip', async () => {
        // Create a directory first (stat will succeed)
        await fs.mkdir('/mock-task-src');

        // Enable mock file read failure
        mockFileReadShouldFail = true;

        // This should trigger task error
        const result = await fs.zip('/mock-task-src', '/mock-task.zip');

        expect(result.isErr()).toBe(true);
        expect(result.unwrapErr().message).toBe('Mocked file read error');
    });
});
