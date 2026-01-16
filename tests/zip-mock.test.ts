/**
 * Test for zip-stream Zip error handling using vitest mocking.
 * Covers fflate Zip error callback (lines 158-160).
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as fs from '../src/mod.ts';

// Mock fflate/browser - Zip throws error
vi.mock('fflate/browser', async (importOriginal) => {
    const original = await importOriginal<typeof import('fflate/browser')>();
    return {
        ...original,
        Zip: class MockZip {
            private cb: (err: Error | null, chunk: Uint8Array, final: boolean) => void;

            constructor(cb: (err: Error | null, chunk: Uint8Array, final: boolean) => void) {
                this.cb = cb;
            }

            add(): void {
                // Simulate error during zip (lines 158-160)
                this.cb(new Error('Mocked fflate zip error'), new Uint8Array(0), false);
            }

            end(): void {
                // noop
            }
        },
    };
});

describe('zip-stream Zip error handling', () => {
    afterEach(async () => {
        vi.restoreAllMocks();
        await fs.remove('/mock-zip-src');
        await fs.remove('/mock-zip.zip');
    });

    it('should handle fflate zip error (zip-stream.ts lines 158-160)', async () => {
        // Create a source directory with a file
        await fs.mkdir('/mock-zip-src');
        await fs.writeFile('/mock-zip-src/test.txt', 'content');

        // This should trigger our mocked Zip class
        const result = await fs.zipStream('/mock-zip-src', '/mock-zip.zip');

        // The error from createZip callback -> controller.error should propagate
        expect(result.isErr()).toBe(true);
        expect(result.unwrapErr().message).toBe('Mocked fflate zip error');
    });
});
