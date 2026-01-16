/**
 * Test for write.ts error handling using vitest mocking.
 * Covers openWritableFileStream getFile error (lines 110-111).
 */
import { Ok } from 'happy-rusty';
import { afterEach, describe, expect, it, vi } from 'vitest';

// Flag to control mock behavior
let mockGetFileShouldFail = false;

// Mock getFileHandle to return a handle where getFile() fails
vi.mock('../src/async/internal/helpers.ts', async (importOriginal) => {
    const original = await importOriginal<typeof import('../src/async/internal/helpers.ts')>();
    return {
        ...original,
        getFileHandle: async (path: string, options?: { create?: boolean; }) => {
            const result = await original.getFileHandle(path, options);
            if (result.isOk() && mockGetFileShouldFail) {
                const realHandle = result.unwrap();
                // Return a proxied handle where getFile() throws
                return Ok({
                    kind: 'file',
                    name: realHandle.name,
                    createWritable: (opts?: FileSystemCreateWritableOptions) => realHandle.createWritable(opts),
                    getFile: () => Promise.reject(new Error('Mocked getFile error')),
                } as FileSystemFileHandle);
            }
            return result;
        },
    };
});

// Import fs after mocking
const fs = await import('../src/mod.ts');

describe('write.ts error handling', () => {
    afterEach(async () => {
        mockGetFileShouldFail = false;
        await fs.remove('/mock-writable-file.txt');
    });

    it('should close writable and throw when getFile fails during append (write.ts lines 110-111)', async () => {
        // Create a file first
        await fs.writeFile('/mock-writable-file.txt', 'initial content');

        // Enable mock failure for getFile
        mockGetFileShouldFail = true;

        // Try to open writable stream with append - getFile() will fail after createWritable()
        const result = await fs.openWritableFileStream('/mock-writable-file.txt', { append: true });

        expect(result.isErr()).toBe(true);
        expect(result.unwrapErr().message).toBe('Mocked getFile error');
    });
});
