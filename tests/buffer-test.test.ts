/**
 * Test file to verify bytes.buffer behavior
 */
import { describe, expect, it } from 'vitest';
import { readFile, writeFile } from '../src/async/mod.ts';

describe('bytes.buffer verification', () => {
    const testPath = '/buffer-test.txt';
    const testData = new Uint8Array([1, 2, 3, 4, 5]);

    it('should verify bytes.buffer has byteOffset 0 and correct length', async () => {
        // Write test file
        const writeRes = await writeFile(testPath, testData);
        expect(writeRes.isOk()).toBe(true);

        // Read as bytes (default encoding)
        const bytesRes = await readFile(testPath);
        expect(bytesRes.isOk()).toBe(true);

        const bytes = bytesRes.unwrap();

        // Verify byteOffset is 0
        expect(bytes.byteOffset).toBe(0);
        // Verify byteLength matches
        expect(bytes.byteLength).toBe(testData.byteLength);
        // Verify buffer.byteLength equals bytes.byteLength (no extra bytes)
        expect(bytes.buffer.byteLength).toBe(bytes.byteLength);
    });

    it('should verify bytes.buffer content equals explicit bytes encoding result', async () => {
        // Read as bytes (default)
        const bytesRes = await readFile(testPath);
        expect(bytesRes.isOk()).toBe(true);
        const bytes = bytesRes.unwrap();

        // Read with explicit bytes encoding
        const explicitBytesRes = await readFile(testPath, { encoding: 'bytes' });
        expect(explicitBytesRes.isOk()).toBe(true);
        const explicitBytes = explicitBytesRes.unwrap();

        // Compare content (not reference)
        expect(Array.from(bytes)).toEqual(Array.from(explicitBytes));
    });

    it('should verify bytes.buffer can be used as ArrayBuffer', async () => {
        // Read as bytes
        const bytesRes = await readFile(testPath, { encoding: 'bytes' });
        expect(bytesRes.isOk()).toBe(true);
        const bytes = bytesRes.unwrap();

        // Access the underlying ArrayBuffer
        const arrayBuffer = bytes.buffer;
        expect(arrayBuffer).toBeInstanceOf(ArrayBuffer);
        expect(arrayBuffer.byteLength).toBe(bytes.byteLength);

        // Create a new Uint8Array from the buffer to verify content
        const bytesFromBuffer = new Uint8Array(arrayBuffer);
        expect(Array.from(bytesFromBuffer)).toEqual(Array.from(testData));
    });
});
