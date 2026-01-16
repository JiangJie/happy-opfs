/**
 * Test for zip.ts fflate compress error (lines 250-251) using vitest mocking.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';

// Mock fflate/browser to make compress fail
vi.mock('fflate/browser', async (importOriginal) => {
    const original = await importOriginal<typeof import('fflate/browser')>();
    return {
        ...original,
        zip: (_data: unknown, _opts: unknown, cb: (err: Error | null, data: Uint8Array) => void) => {
            // Call callback with error to trigger lines 250-251
            cb(new Error('Mocked compress error'), new Uint8Array(0));
        },
    };
});

// Import fs after mocking
const fs = await import('../src/mod.ts');

describe('zip.ts compress error handling', () => {
    afterEach(async () => {
        await fs.remove('/mock-compress-src');
        await fs.remove('/mock-compress.zip');
    });

    it('should handle fflate compress error (zip.ts lines 250-251)', async () => {
        // Create a file to zip
        await fs.writeFile('/mock-compress-src', 'content');

        // This should trigger compress error at lines 250-251
        const result = await fs.zip('/mock-compress-src', '/mock-compress.zip');

        expect(result.isErr()).toBe(true);
        expect(result.unwrapErr().message).toBe('Mocked compress error');
    });
});
