/**
 * Extended OPFS operations tests using Vitest
 * Tests: appendFile, copy, move, emptyDir, exists, readBlobFile, readJsonFile, writeJsonFile
 */
import { afterEach, describe, expect, it } from 'vitest';
import * as fs from '../src/mod.ts';

describe('OPFS Extended Operations', () => {
    afterEach(async () => {
        // Clean up test files
        await fs.remove('/test-append.txt');
        await fs.remove('/test-append-new.txt');
        await fs.remove('/test-append-bin.bin');
        await fs.remove('/copy-src.txt');
        await fs.remove('/copy-dest.txt');
        await fs.remove('/copy-dir-src');
        await fs.remove('/copy-dir-dest');
        await fs.remove('/copy-overwrite-src.txt');
        await fs.remove('/copy-overwrite-dest.txt');
        await fs.remove('/copy-no-overwrite-src.txt');
        await fs.remove('/copy-no-overwrite-dest.txt');
        await fs.remove('/copy-type-mismatch.txt');
        await fs.remove('/copy-type-mismatch-dir');
        await fs.remove('/move-src.txt');
        await fs.remove('/move-dest.txt');
        await fs.remove('/move-dir-src');
        await fs.remove('/move-dir-dest');
        await fs.remove('/move-overwrite-src.txt');
        await fs.remove('/move-overwrite-dest.txt');
        await fs.remove('/empty-dir-test');
        await fs.remove('/new-empty-dir');
        await fs.remove('/exists-test.txt');
        await fs.remove('/exists-dir-test');
        await fs.remove('/exists-isfile.txt');
        await fs.remove('/exists-isfile-dir');
        await fs.remove('/exists-isdir.txt');
        await fs.remove('/exists-isdir-dir');
        await fs.remove('/blob-test.txt');
        await fs.remove('/json-test.json');
        await fs.remove('/json-array.json');
        await fs.remove('/invalid.json');
    });

    describe('appendFile', () => {
        it('should append content to existing file', async () => {
            await fs.writeFile('/test-append.txt', 'Hello');
            await fs.appendFile('/test-append.txt', ' World');

            const content = await fs.readTextFile('/test-append.txt');
            expect(content.unwrap()).toBe('Hello World');
        });

        it('should create file if not exists', async () => {
            await fs.appendFile('/test-append-new.txt', 'New content');

            const content = await fs.readTextFile('/test-append-new.txt');
            expect(content.unwrap()).toBe('New content');
        });

        it('should append binary content', async () => {
            await fs.writeFile('/test-append-bin.bin', new Uint8Array([1, 2, 3]));
            await fs.appendFile('/test-append-bin.bin', new Uint8Array([4, 5, 6]));

            const result = await fs.readFile('/test-append-bin.bin');
            const buffer = result.unwrap();
            expect(buffer.byteLength).toBe(6);
        });
    });

    describe('copy', () => {
        it('should copy a file', async () => {
            await fs.writeFile('/copy-src.txt', 'Copy me');
            const result = await fs.copy('/copy-src.txt', '/copy-dest.txt');
            expect(result.isOk()).toBe(true);

            // Both files should exist
            expect((await fs.exists('/copy-src.txt')).unwrap()).toBe(true);
            expect((await fs.exists('/copy-dest.txt')).unwrap()).toBe(true);

            // Content should be the same
            const content = await fs.readTextFile('/copy-dest.txt');
            expect(content.unwrap()).toBe('Copy me');
        });

        it('should copy a directory', async () => {
            await fs.mkdir('/copy-dir-src/sub');
            await fs.writeFile('/copy-dir-src/file.txt', 'root');
            await fs.writeFile('/copy-dir-src/sub/file.txt', 'sub');

            const result = await fs.copy('/copy-dir-src', '/copy-dir-dest');
            expect(result.isOk()).toBe(true);

            // Verify copied structure
            expect((await fs.exists('/copy-dir-dest/file.txt')).unwrap()).toBe(true);
            expect((await fs.exists('/copy-dir-dest/sub/file.txt')).unwrap()).toBe(true);
        });

        it('should overwrite by default', async () => {
            await fs.writeFile('/copy-overwrite-src.txt', 'New content');
            await fs.writeFile('/copy-overwrite-dest.txt', 'Old content');

            await fs.copy('/copy-overwrite-src.txt', '/copy-overwrite-dest.txt');

            const content = await fs.readTextFile('/copy-overwrite-dest.txt');
            expect(content.unwrap()).toBe('New content');
        });

        it('should not overwrite when overwrite is false', async () => {
            await fs.writeFile('/copy-no-overwrite-src.txt', 'New content');
            await fs.writeFile('/copy-no-overwrite-dest.txt', 'Old content');

            await fs.copy('/copy-no-overwrite-src.txt', '/copy-no-overwrite-dest.txt', { overwrite: false });

            const content = await fs.readTextFile('/copy-no-overwrite-dest.txt');
            expect(content.unwrap()).toBe('Old content');
        });

        it('should fail when src and dest are different types', async () => {
            await fs.writeFile('/copy-type-mismatch.txt', 'file');
            await fs.mkdir('/copy-type-mismatch-dir');

            const result = await fs.copy('/copy-type-mismatch.txt', '/copy-type-mismatch-dir');
            expect(result.isErr()).toBe(true);
        });
    });

    describe('move', () => {
        it('should move a file', async () => {
            await fs.writeFile('/move-src.txt', 'Move me');
            const result = await fs.move('/move-src.txt', '/move-dest.txt');
            expect(result.isOk()).toBe(true);

            // Source should not exist
            expect((await fs.exists('/move-src.txt')).unwrap()).toBe(false);
            // Destination should exist
            expect((await fs.exists('/move-dest.txt')).unwrap()).toBe(true);

            const content = await fs.readTextFile('/move-dest.txt');
            expect(content.unwrap()).toBe('Move me');
        });

        it('should move a directory', async () => {
            await fs.mkdir('/move-dir-src/sub');
            await fs.writeFile('/move-dir-src/file.txt', 'root');

            const result = await fs.move('/move-dir-src', '/move-dir-dest');
            expect(result.isOk()).toBe(true);

            expect((await fs.exists('/move-dir-src')).unwrap()).toBe(false);
            expect((await fs.exists('/move-dir-dest/file.txt')).unwrap()).toBe(true);
        });

        it('should overwrite by default', async () => {
            await fs.writeFile('/move-overwrite-src.txt', 'New');
            await fs.writeFile('/move-overwrite-dest.txt', 'Old');

            await fs.move('/move-overwrite-src.txt', '/move-overwrite-dest.txt');

            const content = await fs.readTextFile('/move-overwrite-dest.txt');
            expect(content.unwrap()).toBe('New');
        });
    });

    describe('emptyDir', () => {
        it('should empty an existing directory', async () => {
            await fs.mkdir('/empty-dir-test');
            await fs.writeFile('/empty-dir-test/file1.txt', 'a');
            await fs.writeFile('/empty-dir-test/file2.txt', 'b');
            await fs.mkdir('/empty-dir-test/sub');

            const result = await fs.emptyDir('/empty-dir-test');
            expect(result.isOk()).toBe(true);

            // Directory should exist but be empty
            expect((await fs.exists('/empty-dir-test', { isDirectory: true })).unwrap()).toBe(true);
            const entries = await Array.fromAsync((await fs.readDir('/empty-dir-test')).unwrap());
            expect(entries.length).toBe(0);
        });

        it('should create directory if not exists', async () => {
            const result = await fs.emptyDir('/new-empty-dir');
            expect(result.isOk()).toBe(true);

            expect((await fs.exists('/new-empty-dir', { isDirectory: true })).unwrap()).toBe(true);
        });
    });

    describe('readBlobFile', () => {
        it('should read file as File object', async () => {
            await fs.writeFile('/blob-test.txt', 'Blob content');

            const result = await fs.readBlobFile('/blob-test.txt');
            const file = result.unwrap();

            expect(file instanceof File).toBe(true);
            expect(file.name).toBe('blob-test.txt');
            expect(file.size).toBe(12);
        });
    });

    describe('readJsonFile & writeJsonFile', () => {
        it('should write and read JSON object', async () => {
            const data = { name: 'test', value: 123, nested: { a: 1 } };

            const writeResult = await fs.writeJsonFile('/json-test.json', data);
            expect(writeResult.isOk()).toBe(true);

            const readResult = await fs.readJsonFile<typeof data>('/json-test.json');
            const parsed = readResult.unwrap();
            expect(parsed).toEqual(data);
        });

        it('should write and read JSON array', async () => {
            const data = [1, 2, 3, { a: 'b' }];

            await fs.writeJsonFile('/json-array.json', data);

            const result = await fs.readJsonFile<typeof data>('/json-array.json');
            expect(result.unwrap()).toEqual(data);
        });

        it('should fail to read invalid JSON', async () => {
            await fs.writeFile('/invalid.json', 'not valid json');

            const result = await fs.readJsonFile('/invalid.json');
            expect(result.isErr()).toBe(true);
        });
    });
});
