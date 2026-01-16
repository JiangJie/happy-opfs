/**
 * Test for write.ts stream error handling using vitest mocking.
 * Covers temp file creation failure and moveFileHandle failure scenarios.
 */
import { Err } from 'happy-rusty';
import { afterEach, describe, expect, it, vi } from 'vitest';

// Flags to control mock behavior
let mockTempFileCreationShouldFail = false;
let mockMoveFileShouldFail = false;

// Mock helpers to control temp file creation and move
vi.mock('../src/async/internal/helpers.ts', async (importOriginal) => {
    const original = await importOriginal<typeof import('../src/async/internal/helpers.ts')>();
    return {
        ...original,
        getFileHandle: async (path: string, options?: { create?: boolean; }) => {
            // Fail temp file creation (paths starting with /tmp/)
            if (mockTempFileCreationShouldFail && path.startsWith('/tmp/') && options?.create) {
                return Err(new Error('Mocked temp file creation error'));
            }
            return original.getFileHandle(path, options);
        },
        moveFileHandle: async (handle: FileSystemFileHandle, destPath: string) => {
            if (mockMoveFileShouldFail) {
                return Err(new Error('Mocked move file error'));
            }
            return original.moveFileHandle(handle, destPath);
        },
    };
});

// Import fs after mocking
const fs = await import('../src/mod.ts');

describe('write.ts stream error handling', () => {
    afterEach(async () => {
        mockTempFileCreationShouldFail = false;
        mockMoveFileShouldFail = false;
        await fs.remove('/mock-stream-file.txt');
        await fs.remove('/tmp');
    });

    it('should return error when temp file creation fails ', async () => {
        // Enable mock failure for temp file creation
        mockTempFileCreationShouldFail = true;

        // Create a stream to write
        const stream = new ReadableStream<Uint8Array<ArrayBuffer>>({
            start(controller) {
                controller.enqueue(new Uint8Array([1, 2, 3]) as Uint8Array<ArrayBuffer>);
                controller.close();
            },
        });

        // Try to write stream to a NEW file (not existing) - this triggers temp file strategy
        const result = await fs.writeFile('/mock-stream-file.txt', stream);

        expect(result.isErr()).toBe(true);
        expect(result.unwrapErr().message).toBe('Mocked temp file creation error');
    });

    it('should clean up temp file when move fails ', async () => {
        // Enable mock failure for move
        mockMoveFileShouldFail = true;

        // Create a stream to write
        const stream = new ReadableStream<Uint8Array<ArrayBuffer>>({
            start(controller) {
                controller.enqueue(new Uint8Array([1, 2, 3]) as Uint8Array<ArrayBuffer>);
                controller.close();
            },
        });

        // Try to write stream to a NEW file - move will fail after temp file is written
        const result = await fs.writeFile('/mock-stream-file.txt', stream);

        expect(result.isErr()).toBe(true);
        expect(result.unwrapErr().message).toBe('Mocked move file error');
    });
});
