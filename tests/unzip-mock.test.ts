/**
 * Test for unzip-stream error handling using vitest mocking.
 * Covers fflate error callbacks.
 */
import type { FlateError, UnzipFile } from 'fflate/browser';
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as fs from '../src/mod.ts';

// Mock fflate/browser
vi.mock('fflate/browser', async (importOriginal) => {
    const original = await importOriginal<typeof import('fflate/browser')>();
    return {
        ...original,
        Unzip: class MockUnzip {
            onfile?: (file: UnzipFile) => void;

            register(): void {
                // noop
            }

            push(_chunk: Uint8Array, _final: boolean): void {
                if (this.onfile) {
                    // Simulate a file entry
                    const file = {
                        name: 'test.txt',
                        start: () => {
                            // Simulate error during extraction (lines 188-189)
                            if (file.ondata) {
                                file.ondata(new Error('Mocked fflate error') as FlateError, new Uint8Array(0), true);
                            }
                        },
                        ondata: undefined as unknown as UnzipFile['ondata'],
                    } as unknown as UnzipFile;

                    this.onfile(file);
                }
            }
        },
    };
});

describe('unzip-stream fflate error handling', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should handle fflate extraction error (unzip-stream.ts lines 188-189)', async () => {
        // Create a dummy zip file
        await fs.writeFile('/mock-fflate.zip', new Uint8Array([1, 2, 3]));

        // This should trigger our mocked Unzip class
        const result = await fs.unzipStream('/mock-fflate.zip', '/mock-fflate-dest');

        // The error from extractFile -> controller.error should propagate
        expect(result.isErr()).toBe(true);
        expect(result.unwrapErr().message).toBe('Mocked fflate error');

        await fs.remove('/mock-fflate.zip');
        await fs.remove('/mock-fflate-dest');
    });
});
