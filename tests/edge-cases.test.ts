/**
 * Edge cases and error handling tests
 * Tests for error conditions, boundary cases, and special scenarios
 */
import { afterEach, describe, expect, it } from 'vitest';
import * as fs from '../src/mod.ts';

describe('OPFS Edge Cases', () => {
    afterEach(async () => {
        await fs.remove('/edge-test');
        await fs.remove('/edge-file.txt');
        await fs.remove('/edge-dir');
        await fs.remove('/edge-copy-src');
        await fs.remove('/edge-copy-dest');
    });

    describe('Path Validation', () => {

        it('should handle paths with special characters', async () => {
            await fs.writeFile('/edge-test-special chars (1).txt', 'content');
            const exists = await fs.exists('/edge-test-special chars (1).txt');
            expect(exists.unwrap()).toBe(true);
            await fs.remove('/edge-test-special chars (1).txt');
        });

        it('should normalize paths correctly', async () => {
            await fs.mkdir('/edge-dir');
            await fs.writeFile('/edge-dir/file.txt', 'content');
            
            // These should all refer to the same file
            const content1 = await fs.readTextFile('/edge-dir/file.txt');
            expect(content1.unwrap()).toBe('content');
        });

        it('should handle file names with dots', async () => {
            await fs.writeFile('/edge-test/file.name.with.dots.txt', 'content');
            const exists = await fs.exists('/edge-test/file.name.with.dots.txt');
            expect(exists.unwrap()).toBe(true);
        });

        it('should handle file names with spaces', async () => {
            await fs.writeFile('/edge-test/file with spaces.txt', 'content');
            const exists = await fs.exists('/edge-test/file with spaces.txt');
            expect(exists.unwrap()).toBe(true);
        });

        it('should handle file names with unicode characters', async () => {
            await fs.writeFile('/edge-test/文件名.txt', '中文内容');
            const content = await fs.readTextFile('/edge-test/文件名.txt');
            expect(content.unwrap()).toBe('中文内容');
        });

        it('should handle file names with emojis', async () => {
            await fs.writeFile('/edge-test/🎉file🎉.txt', 'emoji content');
            const content = await fs.readTextFile('/edge-test/🎉file🎉.txt');
            expect(content.unwrap()).toBe('emoji content');
        });

        it('should handle paths with parentheses', async () => {
            await fs.writeFile('/edge-test/file(1).txt', 'content');
            const exists = await fs.exists('/edge-test/file(1).txt');
            expect(exists.unwrap()).toBe(true);
        });

        it('should handle paths with brackets', async () => {
            await fs.writeFile('/edge-test/file[1].txt', 'content');
            const exists = await fs.exists('/edge-test/file[1].txt');
            expect(exists.unwrap()).toBe(true);
        });

        it('should handle very long file names', async () => {
            const longName = `${ 'a'.repeat(200) }.txt`;
            await fs.writeFile(`/edge-test/${longName}`, 'content');
            const exists = await fs.exists(`/edge-test/${longName}`);
            expect(exists.unwrap()).toBe(true);
        });
    });

    describe('File Content Edge Cases', () => {
        it('should handle empty file', async () => {
            await fs.writeFile('/edge-file.txt', '');
            
            const content = await fs.readTextFile('/edge-file.txt');
            expect(content.unwrap()).toBe('');
        });

        it('should write and read empty Uint8Array', async () => {
            await fs.writeFile('/edge-file.txt', new Uint8Array(0));
            const content = await fs.readFile('/edge-file.txt');
            expect(content.unwrap().byteLength).toBe(0);
        });

        it('should write and read empty ArrayBuffer', async () => {
            await fs.writeFile('/edge-file.txt', new ArrayBuffer(0));
            const content = await fs.readFile('/edge-file.txt');
            expect(content.unwrap().byteLength).toBe(0);
        });

        it('should handle large text content', async () => {
            const largeContent = 'x'.repeat(100000);
            await fs.writeFile('/edge-file.txt', largeContent);
            
            const content = await fs.readTextFile('/edge-file.txt');
            expect(content.unwrap().length).toBe(100000);
        });

        it('should handle unicode content', async () => {
            const unicodeContent = '你好世界 🌍 مرحبا العالم';
            await fs.writeFile('/edge-file.txt', unicodeContent);
            
            const content = await fs.readTextFile('/edge-file.txt');
            expect(content.unwrap()).toBe(unicodeContent);
        });

        it('should handle binary data with all byte values', async () => {
            const data = new Uint8Array(256);
            for (let i = 0; i < 256; i++) {
                data[i] = i;
            }
            await fs.writeFile('/edge-file.txt', data);
            
            const result = await fs.readFile('/edge-file.txt');
            const buffer = result.unwrap();
            expect(buffer.byteLength).toBe(256);
            
            const arr = new Uint8Array(buffer);
            expect(arr[0]).toBe(0);
            expect(arr[255]).toBe(255);
        });

        it('should handle null bytes', async () => {
            const data = new Uint8Array([0, 0, 0, 0, 0]);
            await fs.writeFile('/edge-file.txt', data);
            const content = await fs.readFile('/edge-file.txt');
            expect(new Uint8Array(content.unwrap())).toEqual(data);
        });

        it('should handle max byte value', async () => {
            const data = new Uint8Array([255, 255, 255, 255, 255]);
            await fs.writeFile('/edge-file.txt', data);
            const content = await fs.readFile('/edge-file.txt');
            expect(new Uint8Array(content.unwrap())).toEqual(data);
        });

        it('should handle Uint8Array with offset', async () => {
            const buffer = new ArrayBuffer(10);
            const fullView = new Uint8Array(buffer);
            fullView.set([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);

            // Create a view with offset
            const offsetView = new Uint8Array(buffer, 2, 5);
            await fs.writeFile('/edge-file.txt', offsetView);

            const content = await fs.readFile('/edge-file.txt');
            const result = new Uint8Array(content.unwrap());
            expect(result).toEqual(new Uint8Array([2, 3, 4, 5, 6]));
        });
    });

    describe('Directory Edge Cases', () => {
        it('should handle deeply nested directories', async () => {
            const deepPath = '/edge-dir/a/b/c/d/e/f/g/h/i/j';
            await fs.mkdir(deepPath);
            
            expect((await fs.exists(deepPath, { isDirectory: true })).unwrap()).toBe(true);
        });

        it('should handle creating directory at root level', async () => {
            await fs.mkdir('/edge-test');
            const exists = await fs.exists('/edge-test', { isDirectory: true });
            expect(exists.unwrap()).toBe(true);
        });

        it('should handle empty directory', async () => {
            await fs.mkdir('/edge-dir');
            
            const entries = await Array.fromAsync((await fs.readDir('/edge-dir')).unwrap());
            expect(entries.length).toBe(0);
        });

        it('should handle readDir on root', async () => {
            // Create a test directory first
            await fs.mkdir('/edge-test');
            const result = await fs.readDir('/');
            expect(result.isOk()).toBe(true);
        });

        it('should handle directory with many files', async () => {
            await fs.mkdir('/edge-dir');
            
            // Create 50 files
            for (let i = 0; i < 50; i++) {
                await fs.writeFile(`/edge-dir/file${i}.txt`, `content${i}`);
            }
            
            const entries = await Array.fromAsync((await fs.readDir('/edge-dir')).unwrap());
            expect(entries.length).toBe(50);
        });
    });

    describe('Copy/Move Edge Cases', () => {
        it('should copy file to nested directory that does not exist', async () => {
            await fs.writeFile('/edge-copy-src', 'content');
            
            const result = await fs.copy('/edge-copy-src', '/edge-copy-dest/nested/dir/file.txt');
            expect(result.isOk()).toBe(true);
            
            expect((await fs.exists('/edge-copy-dest/nested/dir/file.txt')).unwrap()).toBe(true);
        });

        it('should copy deeply nested directory structure', async () => {
            // Create nested structure
            await fs.mkdir('/edge-copy-src/a/b/c');
            await fs.writeFile('/edge-copy-src/a/file1.txt', 'content1');
            await fs.writeFile('/edge-copy-src/a/b/file2.txt', 'content2');
            await fs.writeFile('/edge-copy-src/a/b/c/file3.txt', 'content3');

            // Copy
            const result = await fs.copy('/edge-copy-src', '/edge-copy-dest');
            expect(result.isOk()).toBe(true);

            // Verify structure
            expect((await fs.exists('/edge-copy-dest/a/b/c', { isDirectory: true })).unwrap()).toBe(true);
            expect((await fs.readTextFile('/edge-copy-dest/a/file1.txt')).unwrap()).toBe('content1');
            expect((await fs.readTextFile('/edge-copy-dest/a/b/file2.txt')).unwrap()).toBe('content2');
            expect((await fs.readTextFile('/edge-copy-dest/a/b/c/file3.txt')).unwrap()).toBe('content3');
        });

        it('should handle move overwrite scenario', async () => {
            await fs.writeFile('/edge-copy-src', 'new content');
            await fs.writeFile('/edge-copy-dest', 'old content');
            
            const result = await fs.move('/edge-copy-src', '/edge-copy-dest', { overwrite: true });
            expect(result.isOk()).toBe(true);
            
            const content = await fs.readTextFile('/edge-copy-dest');
            expect(content.unwrap()).toBe('new content');
        });

        it('should handle move no overwrite scenario', async () => {
            await fs.writeFile('/edge-copy-src', 'new content');
            await fs.writeFile('/edge-copy-dest', 'old content');
            
            const result = await fs.move('/edge-copy-src', '/edge-copy-dest', { overwrite: false });
            expect(result.isOk()).toBe(true);
            
            // Destination content should remain unchanged
            const content = await fs.readTextFile('/edge-copy-dest');
            expect(content.unwrap()).toBe('old content');
        });

        it('should move file to nested path that does not exist', async () => {
            await fs.writeFile('/edge-copy-src', 'content');

            const result = await fs.move('/edge-copy-src', '/edge-copy-dest/deep/nested/dest.txt');
            expect(result.isOk()).toBe(true);

            expect((await fs.exists('/edge-copy-src')).unwrap()).toBe(false);
            expect((await fs.readTextFile('/edge-copy-dest/deep/nested/dest.txt')).unwrap()).toBe('content');
        });
    });

    describe('Stream Edge Cases', () => {
        it('should write empty content with stream', async () => {
            const result = await fs.openWritableFileStream('/edge-file.txt');
            const stream = result.unwrap();
            await stream.close();

            const content = await fs.readFile('/edge-file.txt');
            expect(content.unwrap().byteLength).toBe(0);
        });

        it('should write single byte with stream', async () => {
            const result = await fs.openWritableFileStream('/edge-file.txt');
            const stream = result.unwrap();
            await stream.write(new Uint8Array([42]));
            await stream.close();

            const content = await fs.readFile('/edge-file.txt');
            expect(new Uint8Array(content.unwrap())[0]).toBe(42);
        });

        it('should handle multiple write operations', async () => {
            const result = await fs.openWritableFileStream('/edge-file.txt');
            const stream = result.unwrap();

            try {
                for (let i = 0; i < 100; i++) {
                    await stream.write(`line${i}\n`);
                }
            } finally {
                await stream.close();
            }

            const content = await fs.readTextFile('/edge-file.txt');
            const lines = content.unwrap().trim().split('\n');
            expect(lines.length).toBe(100);
        });
    });

    describe('JSON Edge Cases', () => {
        it('should handle complex nested JSON', async () => {
            const complexData = {
                array: [1, 2, 3],
                nested: {
                    deep: {
                        value: 'test',
                    },
                },
                null_value: null,
                boolean: true,
                number: 42.5,
            };

            await fs.writeJsonFile('/edge-file.txt', complexData);
            const result = await fs.readJsonFile<typeof complexData>('/edge-file.txt');
            expect(result.unwrap()).toEqual(complexData);
        });

        it('should handle JSON with special characters in strings', async () => {
            const data = {
                message: 'Hello "World"!\n\tTab here',
                unicode: '你好',
            };

            await fs.writeJsonFile('/edge-file.txt', data);
            const result = await fs.readJsonFile<typeof data>('/edge-file.txt');
            expect(result.unwrap()).toEqual(data);
        });

        it('should handle JSON with null values', async () => {
            const data = { a: null, b: [null], c: { d: null } };
            await fs.writeJsonFile('/edge-file.txt', data);
            const result = await fs.readJsonFile('/edge-file.txt');
            expect(result.unwrap()).toEqual(data);
        });

        it('should handle JSON with empty array', async () => {
            const data: unknown[] = [];
            await fs.writeJsonFile('/edge-file.txt', data);
            const result = await fs.readJsonFile('/edge-file.txt');
            expect(result.unwrap()).toEqual([]);
        });

        it('should handle JSON with empty object', async () => {
            const data = {};
            await fs.writeJsonFile('/edge-file.txt', data);
            const result = await fs.readJsonFile('/edge-file.txt');
            expect(result.unwrap()).toEqual({});
        });

        it('should handle JSON with numbers', async () => {
            const data = {
                int: 42,
                float: 3.14159,
                negative: -100,
                zero: 0,
                scientific: 1.23e10,
            };
            await fs.writeJsonFile('/edge-file.txt', data);
            const result = await fs.readJsonFile('/edge-file.txt');
            expect(result.unwrap()).toEqual(data);
        });

        it('should handle JSON with boolean values', async () => {
            const data = { trueVal: true, falseVal: false };
            await fs.writeJsonFile('/edge-file.txt', data);
            const result = await fs.readJsonFile('/edge-file.txt');
            expect(result.unwrap()).toEqual(data);
        });
    });

    describe('Concurrent Operations', () => {
        it('should handle multiple concurrent reads', async () => {
            await fs.writeFile('/edge-file.txt', 'content');

            const results = await Promise.all([
                fs.readTextFile('/edge-file.txt'),
                fs.readTextFile('/edge-file.txt'),
                fs.readTextFile('/edge-file.txt'),
            ]);

            results.forEach(result => {
                expect(result.unwrap()).toBe('content');
            });
        });

        it('should handle concurrent mkdir operations', async () => {
            const promises = [
                fs.mkdir('/edge-test/a'),
                fs.mkdir('/edge-test/b'),
                fs.mkdir('/edge-test/c'),
            ];

            const results = await Promise.all(promises);
            results.forEach(r => expect(r.isOk()).toBe(true));
        });

        it('should handle multiple concurrent writes to different files', async () => {
            await fs.mkdir('/edge-dir');

            await Promise.all([
                fs.writeFile('/edge-dir/file1.txt', 'content1'),
                fs.writeFile('/edge-dir/file2.txt', 'content2'),
                fs.writeFile('/edge-dir/file3.txt', 'content3'),
            ]);

            const [c1, c2, c3] = await Promise.all([
                fs.readTextFile('/edge-dir/file1.txt'),
                fs.readTextFile('/edge-dir/file2.txt'),
                fs.readTextFile('/edge-dir/file3.txt'),
            ]);

            expect(c1.unwrap()).toBe('content1');
            expect(c2.unwrap()).toBe('content2');
            expect(c3.unwrap()).toBe('content3');
        });

        it('should handle concurrent write operations to different files at scale', async () => {
            await fs.mkdir('/edge-dir');

            const promises = [];
            for (let i = 0; i < 20; i++) {
                promises.push(fs.writeFile(`/edge-dir/file${i}.txt`, `content ${i}`));
            }

            const results = await Promise.all(promises);
            results.forEach(r => expect(r.isOk()).toBe(true));

            const entries = await Array.fromAsync((await fs.readDir('/edge-dir')).unwrap());
            expect(entries.length).toBe(20);
        });

        it('should handle concurrent read operations at scale', async () => {
            await fs.writeFile('/edge-file.txt', 'shared content');

            const promises = [];
            for (let i = 0; i < 10; i++) {
                promises.push(fs.readTextFile('/edge-file.txt'));
            }

            const results = await Promise.all(promises);
            results.forEach(r => {
                expect(r.isOk()).toBe(true);
                expect(r.unwrap()).toBe('shared content');
            });
        });
    });

    describe('Append Operations', () => {
        it('should append to non-existent file', async () => {
            await fs.appendFile('/edge-file.txt', 'first');
            const content = await fs.readTextFile('/edge-file.txt');
            expect(content.unwrap()).toBe('first');
        });

        it('should append multiple times', async () => {
            await fs.appendFile('/edge-file.txt', 'a');
            await fs.appendFile('/edge-file.txt', 'b');
            await fs.appendFile('/edge-file.txt', 'c');
            const content = await fs.readTextFile('/edge-file.txt');
            expect(content.unwrap()).toBe('abc');
        });

        it('should append binary data', async () => {
            await fs.appendFile('/edge-file.txt', new Uint8Array([1, 2]));
            await fs.appendFile('/edge-file.txt', new Uint8Array([3, 4]));
            const content = await fs.readFile('/edge-file.txt');
            expect(new Uint8Array(content.unwrap())).toEqual(new Uint8Array([1, 2, 3, 4]));
        });
    });
});
