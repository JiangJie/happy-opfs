/**
 * Mock tests for src/shared/helpers.ts
 * Covers the FileReaderSync branch for reading blob bytes synchronously in Worker context.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

// Store original FileReaderSync (undefined in main thread)
const originalFileReaderSync = globalThis.FileReaderSync;

// Mock FileReaderSync class
class MockFileReaderSync {
    readAsArrayBuffer(blob: Blob): ArrayBuffer {
        // Create a simple mock that returns an ArrayBuffer
        // We'll use a synchronous approach with a pre-defined response
        const size = blob.size;
        const buffer = new ArrayBuffer(size);
        // For testing purposes, we just return an empty buffer of the correct size
        return buffer;
    }
}

describe('readBlobBytesSync with mocked FileReaderSync', () => {
    beforeAll(() => {
        // Install mock FileReaderSync
        // @ts-expect-error - FileReaderSync doesn't exist in main thread
        globalThis.FileReaderSync = MockFileReaderSync;
    });

    afterAll(() => {
        // Restore original (undefined in main thread)
        globalThis.FileReaderSync = originalFileReaderSync;
    });

    it('should use FileReaderSync to read blob bytes when available', async () => {
        // Import after mock is installed
        const { readBlobBytesSync } = await import('../src/shared/helpers.ts');

        const testData = new Uint8Array([1, 2, 3, 4, 5]);
        const blob = new Blob([testData]);

        const result = readBlobBytesSync(blob);

        expect(result).toBeInstanceOf(Uint8Array);
        expect(result.byteLength).toBe(5);
    });
});
