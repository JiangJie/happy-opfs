/**
 * Test for zip.ts file read task error (line 132) using vitest mocking.
 */
import { Ok } from 'happy-rusty';
import { afterEach, describe, expect, it, vi } from 'vitest';

// Flag to control mock behavior
let mockFileReadShouldFail = false;

// Mock the read module to return a file handle that fails on getFile()
vi.mock('../src/async/core/read.ts', async (importOriginal) => {
    const original = await importOriginal<typeof import('../src/async/core/read.ts')>();
    return {
        ...original,
        readDir: (path: string, options?: { recursive?: boolean; }) => {
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

describe('zip.ts file read task error', () => {
    afterEach(async () => {
        mockFileReadShouldFail = false;
        await fs.remove('/mock-task-src');
        await fs.remove('/mock-task.zip');
    });

    it('should handle file read task error (zip.ts line 132)', async () => {
        // Create a directory first (stat will succeed)
        await fs.mkdir('/mock-task-src');

        // Enable mock file read failure
        mockFileReadShouldFail = true;

        // This should trigger task error at line 132
        const result = await fs.zip('/mock-task-src', '/mock-task.zip');

        expect(result.isErr()).toBe(true);
        expect(result.unwrapErr().message).toBe('Mocked file read error');
    });
});
