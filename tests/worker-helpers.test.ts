/**
 * Tests for worker helpers functions
 * Covers: serializeFile, deserializeFile, serializeError, deserializeError, setGlobalOpTimeout, sleepUntil
 */
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import * as fs from '../src/mod.ts';

describe('Worker Helpers', () => {
    beforeAll(async () => {
        await fs.connectSyncAgent({
            worker: new Worker(new URL('./worker.ts', import.meta.url), {
                type: 'module'
            }),
            bufferLength: 10 * 1024 * 1024,
            opTimeout: 5000,
        });
    });

    afterAll(() => {
        fs.emptyDirSync(fs.ROOT_DIR);
    });

    afterEach(() => {
        fs.removeSync('/test-file-serialize.txt');
    });

    describe('File serialization/deserialization (via readBlobFileSync)', () => {
        it('should serialize and deserialize file content correctly', () => {
            // Create a file with specific content
            const content = 'Test file content for serialization';
            fs.writeFileSync('/test-file-serialize.txt', content);

            // Read as blob - this triggers serializeFile in worker and deserializeFile in adapter
            const result = fs.readBlobFileSync('/test-file-serialize.txt');
            expect(result.isOk()).toBe(true);

            const fileLike = result.unwrap();
            expect(fileLike.name).toBe('test-file-serialize.txt');
            expect(fileLike.size).toBe(content.length);
            expect(fileLike.data).toBeInstanceOf(ArrayBuffer);

            // Verify data content
            const decoder = new TextDecoder();
            const decodedContent = decoder.decode(new Uint8Array(fileLike.data));
            expect(decodedContent).toBe(content);
        });

        it('should handle file with binary content', () => {
            // Binary content including null bytes
            const binaryData = new Uint8Array([0, 1, 2, 128, 255, 0, 127]);
            fs.writeFileSync('/test-file-serialize.txt', binaryData);

            const result = fs.readBlobFileSync('/test-file-serialize.txt');
            expect(result.isOk()).toBe(true);

            const fileLike = result.unwrap();
            expect(fileLike.size).toBe(7);

            const arr = new Uint8Array(fileLike.data);
            expect(arr).toEqual(binaryData);
        });

        it('should preserve file type information', () => {
            fs.writeFileSync('/test-file-serialize.txt', 'content');

            const result = fs.readBlobFileSync('/test-file-serialize.txt');
            const fileLike = result.unwrap();

            // FileLike should have type property (may be empty for OPFS files)
            expect(typeof fileLike.type).toBe('string');
            expect(typeof fileLike.lastModified).toBe('number');
        });

        it('should handle empty file', () => {
            fs.writeFileSync('/test-file-serialize.txt', '');

            const result = fs.readBlobFileSync('/test-file-serialize.txt');
            expect(result.isOk()).toBe(true);

            const fileLike = result.unwrap();
            expect(fileLike.size).toBe(0);
            expect(fileLike.data.byteLength).toBe(0);
        });

        it('should handle large file content', () => {
            // Create a file with larger content
            const largeContent = 'x'.repeat(100000);
            fs.writeFileSync('/test-file-serialize.txt', largeContent);

            const result = fs.readBlobFileSync('/test-file-serialize.txt');
            expect(result.isOk()).toBe(true);

            const fileLike = result.unwrap();
            expect(fileLike.size).toBe(100000);
        });
    });

    describe('Error serialization/deserialization (via sync operations)', () => {
        it('should serialize and deserialize error when file not found', () => {
            const result = fs.readFileSync('/non-existent-file-xyz.txt');
            expect(result.isErr()).toBe(true);

            const error = result.unwrapErr();
            expect(error).toBeInstanceOf(Error);
            expect(error.name).toBe('NotFoundError');
        });

        it('should preserve error message', () => {
            const result = fs.readDirSync('/non-existent-dir-xyz');
            expect(result.isErr()).toBe(true);

            const error = result.unwrapErr();
            expect(typeof error.message).toBe('string');
            expect(error.message.length).toBeGreaterThan(0);
        });

        it('should handle error for reading file as directory', () => {
            fs.writeFileSync('/test-file-serialize.txt', 'content');
            const result = fs.readDirSync('/test-file-serialize.txt');

            expect(result.isErr()).toBe(true);
            const error = result.unwrapErr();
            expect(error).toBeInstanceOf(Error);
        });
    });
});
