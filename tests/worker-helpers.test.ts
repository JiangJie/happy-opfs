/**
 * Tests for worker serialization/deserialization functions via sync APIs
 * Covers: serializeFile, deserializeFile, serializeError, deserializeError, toFileSystemHandleLike
 */
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import * as fs from '../src/mod.ts';

describe('Worker Helpers', () => {
    beforeAll(async () => {
        await fs.SyncChannel.connect(
            new Worker(new URL('./worker.ts', import.meta.url), {
                type: 'module',
            }),
            {
                sharedBufferLength: 10 * 1024 * 1024,
                opTimeout: 5000,
            },
        );
    });

    afterAll(() => {
        fs.emptyDirSync(fs.ROOT_DIR);
    });

    afterEach(() => {
        fs.removeSync('/test-file-serialize.txt');
    });

    describe('File serialization/deserialization (via readBlobFileSync)', () => {
        it('should serialize and deserialize file content correctly', async () => {
            // Create a file with specific content
            const content = 'Test file content for serialization';
            fs.writeFileSync('/test-file-serialize.txt', content);

            // Read as blob - this triggers serializeFile in worker and deserializeFile in adapter
            const result = fs.readBlobFileSync('/test-file-serialize.txt');
            expect(result.isOk()).toBe(true);

            const file = result.unwrap();
            expect(file.name).toBe('test-file-serialize.txt');
            expect(file.size).toBe(content.length);

            // Verify data content by reading the file
            const text = await file.text();
            expect(text).toBe(content);
        });

        it('should handle file with binary content', async () => {
            // Binary content including null bytes
            const binaryData = new Uint8Array([0, 1, 2, 128, 255, 0, 127]);
            fs.writeFileSync('/test-file-serialize.txt', binaryData);

            const result = fs.readBlobFileSync('/test-file-serialize.txt');
            expect(result.isOk()).toBe(true);

            const file = result.unwrap();
            expect(file.size).toBe(7);

            const buffer = await file.arrayBuffer();
            const arr = new Uint8Array(buffer);
            expect(arr).toEqual(binaryData);
        });

        it('should preserve file type information', () => {
            fs.writeFileSync('/test-file-serialize.txt', 'content');

            const result = fs.readBlobFileSync('/test-file-serialize.txt');
            const file = result.unwrap();

            // File should have type property (may be empty for OPFS files)
            expect(typeof file.type).toBe('string');
            expect(typeof file.lastModified).toBe('number');
        });

        it('should handle empty file', () => {
            fs.writeFileSync('/test-file-serialize.txt', '');

            const result = fs.readBlobFileSync('/test-file-serialize.txt');
            expect(result.isOk()).toBe(true);

            const file = result.unwrap();
            expect(file.size).toBe(0);
        });

        it('should handle large file content', () => {
            // Create a file with larger content
            const largeContent = 'x'.repeat(100000);
            fs.writeFileSync('/test-file-serialize.txt', largeContent);

            const result = fs.readBlobFileSync('/test-file-serialize.txt');
            expect(result.isOk()).toBe(true);

            const file = result.unwrap();
            expect(file.size).toBe(100000);
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
