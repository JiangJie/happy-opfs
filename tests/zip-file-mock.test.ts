/**
 * Test for zip.ts file handle error (line 82) using vitest mocking.
 */
import { Ok } from 'happy-rusty';
import { afterEach, describe, expect, it, vi } from 'vitest';

// Flag to control mock behavior
let mockGetFileShouldFail = false;

// Mock stat to return a file handle that fails on getFile()
vi.mock('../src/async/core/stat.ts', async (importOriginal) => {
    const original = await importOriginal<typeof import('../src/async/core/stat.ts')>();
    return {
        ...original,
        stat: async (path: string) => {
            const result = await original.stat(path);
            if (result.isOk() && mockGetFileShouldFail) {
                const handle = result.unwrap();
                if (handle.kind === 'file') {
                    // Return a file handle that fails on getFile()
                    return Ok({
                        kind: 'file',
                        name: handle.name,
                        getFile: () => Promise.reject(new Error('Mocked getFile error')),
                    } as FileSystemFileHandle);
                }
            }
            return result;
        },
    };
});

// Import fs after mocking
const fs = await import('../src/mod.ts');

describe('zip.ts file handle error', () => {
    afterEach(async () => {
        mockGetFileShouldFail = false;
        await fs.remove('/mock-zip-file.txt');
        await fs.remove('/mock-zip.zip');
    });

    it('should handle getFileDataByHandle error (zip.ts line 82)', async () => {
        // Create a file first
        await fs.writeFile('/mock-zip-file.txt', 'content');

        // Enable mock failure for file handle
        mockGetFileShouldFail = true;

        // This should trigger getFileDataByHandle error at line 82
        const result = await fs.zip('/mock-zip-file.txt', '/mock-zip.zip');

        expect(result.isErr()).toBe(true);
        expect(result.unwrapErr().message).toBe('Mocked getFile error');
    });
});
