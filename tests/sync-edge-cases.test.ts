/**
 * Sync API edge cases tests using Vitest
 * Tests edge cases and error handling for synchronous operations
 */
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import * as fs from '../src/mod.ts';

describe('OPFS Sync Edge Cases', () => {
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
        fs.removeSync('/sync-edge');
        fs.removeSync('/sync-edge-file.txt');
    });

    describe('Error handling', () => {
        it('should return Err for reading non-existent file', () => {
            const result = fs.readFileSync('/non-existent-xyz.txt');
            expect(result.isErr()).toBe(true);
        });

        it('should return Err for reading non-existent directory', () => {
            const result = fs.readDirSync('/non-existent-dir-xyz');
            expect(result.isErr()).toBe(true);
        });

        it('should return Err for stat on non-existent path', () => {
            const result = fs.statSync('/non-existent-path-xyz');
            expect(result.isErr()).toBe(true);
        });

        it('should return Err for invalid JSON', () => {
            fs.writeFileSync('/sync-edge-file.txt', 'not valid json');
            const result = fs.readJsonFileSync('/sync-edge-file.txt');
            expect(result.isErr()).toBe(true);
        });
    });

    describe('Boundary cases', () => {
        it('should handle empty file', () => {
            fs.writeFileSync('/sync-edge-file.txt', '');
            const result = fs.readTextFileSync('/sync-edge-file.txt');
            expect(result.unwrap()).toBe('');
        });

        it('should handle unicode content', () => {
            const content = '中文内容 🎉 العربية';
            fs.writeFileSync('/sync-edge-file.txt', content);
            const result = fs.readTextFileSync('/sync-edge-file.txt');
            expect(result.unwrap()).toBe(content);
        });

        it('should handle binary data with all byte values', () => {
            const data = new Uint8Array(256);
            for (let i = 0; i < 256; i++) {
                data[i] = i;
            }
            fs.writeFileSync('/sync-edge-file.txt', data);
            const result = fs.readFileSync('/sync-edge-file.txt');
            const buffer = result.unwrap();
            expect(buffer.byteLength).toBe(256);
        });

        it('should handle deeply nested paths', () => {
            const path = '/sync-edge/a/b/c/d/e/f/g/file.txt';
            const writeResult = fs.writeFileSync(path, 'deep content');
            expect(writeResult.isOk()).toBe(true);

            const readResult = fs.readTextFileSync(path);
            expect(readResult.unwrap()).toBe('deep content');
        });

        it('should handle special characters in file names', () => {
            fs.mkdirSync('/sync-edge');
            fs.writeFileSync('/sync-edge/file with spaces.txt', 'content');
            expect(fs.existsSync('/sync-edge/file with spaces.txt').unwrap()).toBe(true);
        });
    });

    describe('Copy/Move sync operations', () => {
        it('should copy file', () => {
            fs.writeFileSync('/sync-edge-file.txt', 'original');
            const result = fs.copySync('/sync-edge-file.txt', '/sync-edge/copied.txt');
            expect(result.isOk()).toBe(true);

            expect(fs.existsSync('/sync-edge-file.txt').unwrap()).toBe(true);
            expect(fs.readTextFileSync('/sync-edge/copied.txt').unwrap()).toBe('original');
        });

        it('should move file', () => {
            fs.writeFileSync('/sync-edge-file.txt', 'to move');
            const result = fs.moveSync('/sync-edge-file.txt', '/sync-edge/moved.txt');
            expect(result.isOk()).toBe(true);

            expect(fs.existsSync('/sync-edge-file.txt').unwrap()).toBe(false);
            expect(fs.readTextFileSync('/sync-edge/moved.txt').unwrap()).toBe('to move');
        });

        it('should copy directory', () => {
            fs.mkdirSync('/sync-edge/src');
            fs.writeFileSync('/sync-edge/src/file.txt', 'content');
            fs.mkdirSync('/sync-edge/src/sub');
            fs.writeFileSync('/sync-edge/src/sub/nested.txt', 'nested');

            const result = fs.copySync('/sync-edge/src', '/sync-edge/dest');
            expect(result.isOk()).toBe(true);

            expect(fs.existsSync('/sync-edge/dest/file.txt').unwrap()).toBe(true);
            expect(fs.existsSync('/sync-edge/dest/sub/nested.txt').unwrap()).toBe(true);
        });
    });

    describe('Temp sync operations', () => {
        it('should create temp file with custom options', () => {
            const result = fs.mkTempSync({ basename: 'sync-test', extname: '.log' });
            const path = result.unwrap();

            expect(path.startsWith('/tmp/sync-test-')).toBe(true);
            expect(path.endsWith('.log')).toBe(true);
            expect(fs.existsSync(path).unwrap()).toBe(true);
        });

        it('should create temp directory', () => {
            const result = fs.mkTempSync({ isDirectory: true, basename: 'sync-dir' });
            const path = result.unwrap();

            expect(fs.existsSync(path, { isDirectory: true }).unwrap()).toBe(true);
        });
    });

    describe('JSON sync operations', () => {
        it('should write and read JSON with various types', () => {
            const data = {
                string: 'hello',
                number: 42,
                boolean: true,
                null: null,
                array: [1, 2, 3],
                nested: { a: { b: { c: 'deep' } } },
            };

            fs.writeJsonFileSync('/sync-edge-file.txt', data);
            const result = fs.readJsonFileSync<typeof data>('/sync-edge-file.txt');
            expect(result.unwrap()).toEqual(data);
        });

        it('should handle empty object', () => {
            fs.writeJsonFileSync('/sync-edge-file.txt', {});
            const result = fs.readJsonFileSync('/sync-edge-file.txt');
            expect(result.unwrap()).toEqual({});
        });

        it('should handle empty array', () => {
            fs.writeJsonFileSync('/sync-edge-file.txt', []);
            const result = fs.readJsonFileSync('/sync-edge-file.txt');
            expect(result.unwrap()).toEqual([]);
        });
    });

    describe('ReadDir sync with options', () => {
        it('should read directory non-recursively', () => {
            fs.mkdirSync('/sync-edge');
            fs.writeFileSync('/sync-edge/file1.txt', 'a');
            fs.writeFileSync('/sync-edge/file2.txt', 'b');
            fs.mkdirSync('/sync-edge/sub');
            fs.writeFileSync('/sync-edge/sub/nested.txt', 'c');

            const result = fs.readDirSync('/sync-edge');
            const entries = result.unwrap();
            expect(entries.length).toBe(3); // file1, file2, sub
        });

        it('should read directory recursively', () => {
            fs.mkdirSync('/sync-edge');
            fs.writeFileSync('/sync-edge/file1.txt', 'a');
            fs.mkdirSync('/sync-edge/sub');
            fs.writeFileSync('/sync-edge/sub/nested.txt', 'c');

            const result = fs.readDirSync('/sync-edge', { recursive: true });
            const entries = result.unwrap();
            expect(entries.length).toBe(3); // file1, sub, sub/nested
        });
    });

    describe('Exists sync with options', () => {
        it('should check isFile correctly', () => {
            fs.writeFileSync('/sync-edge-file.txt', 'content');
            fs.mkdirSync('/sync-edge');

            expect(fs.existsSync('/sync-edge-file.txt', { isFile: true }).unwrap()).toBe(true);
            expect(fs.existsSync('/sync-edge', { isFile: true }).unwrap()).toBe(false);
        });

        it('should check isDirectory correctly', () => {
            fs.writeFileSync('/sync-edge-file.txt', 'content');
            fs.mkdirSync('/sync-edge');

            expect(fs.existsSync('/sync-edge-file.txt', { isDirectory: true }).unwrap()).toBe(false);
            expect(fs.existsSync('/sync-edge', { isDirectory: true }).unwrap()).toBe(true);
        });
    });

    describe('Append sync operations', () => {
        it('should append to existing file', () => {
            fs.writeFileSync('/sync-edge-file.txt', 'Hello');
            fs.appendFileSync('/sync-edge-file.txt', ' World');

            const result = fs.readTextFileSync('/sync-edge-file.txt');
            expect(result.unwrap()).toBe('Hello World');
        });

        it('should create file if not exists when appending', () => {
            fs.appendFileSync('/sync-edge-file.txt', 'New content');

            const result = fs.readTextFileSync('/sync-edge-file.txt');
            expect(result.unwrap()).toBe('New content');
        });

        it('should append binary data', () => {
            fs.writeFileSync('/sync-edge-file.txt', new Uint8Array([1, 2, 3]));
            fs.appendFileSync('/sync-edge-file.txt', new Uint8Array([4, 5, 6]));

            const result = fs.readFileSync('/sync-edge-file.txt');
            const buffer = result.unwrap();
            expect(buffer.byteLength).toBe(6);
        });
    });
});
