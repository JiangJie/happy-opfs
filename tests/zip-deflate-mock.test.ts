/**
 * Test for zip-stream ZipDeflate error handling using vitest mocking.
 * Covers ZipDeflate push error (line 288).
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as fs from '../src/mod.ts';

// Mock fflate/browser - ZipDeflate throws error on push
vi.mock('fflate/browser', async (importOriginal) => {
    const original = await importOriginal<typeof import('fflate/browser')>();
    return {
        ...original,
        ZipDeflate: class MockZipDeflate {
            // Properties expected by Zip.add()
            filename: Uint8Array;
            crc: number;
            size: number;
            compression: number;
            flag: number;
            ondata?: (err: Error | null, chunk: Uint8Array, final: boolean) => void;
            terminate?: () => void;

            constructor(name: string) {
                // Encode filename as Uint8Array (required by Zip)
                this.filename = new TextEncoder().encode(name);
                this.crc = 0;
                this.size = 0;
                this.compression = 8; // DEFLATE
                this.flag = 0;
            }

            push(_chunk: Uint8Array, _final: boolean): void {
                // Simulate error during entry processing (line 288)
                throw new Error('Mocked ZipDeflate push error');
            }
        },
    };
});

describe('zip-stream ZipDeflate error handling', () => {
    afterEach(async () => {
        vi.restoreAllMocks();
        await fs.remove('/mock-deflate-src');
        await fs.remove('/mock-deflate.zip');
    });

    it('should handle ZipDeflate push error (zip-stream.ts line 288)', async () => {
        // Create a source directory with a file
        await fs.mkdir('/mock-deflate-src');
        await fs.writeFile('/mock-deflate-src/test.txt', 'content');

        // This should trigger our mocked ZipDeflate class which throws on push
        const result = await fs.zipStream('/mock-deflate-src', '/mock-deflate.zip');

        // The error from processEntry -> controller.error should propagate
        expect(result.isErr()).toBe(true);
        expect(result.unwrapErr().message).toBe('Mocked ZipDeflate push error');
    });
});
