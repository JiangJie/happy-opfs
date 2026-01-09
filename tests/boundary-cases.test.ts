/**
 * Boundary cases tests using Vitest
 * Tests for special paths, large data, concurrent operations
 */
import { afterEach, describe, expect, it } from 'vitest';
import * as fs from '../src/mod.ts';

describe('Boundary Cases', () => {
    afterEach(async () => {
        await fs.remove('/boundary-test');
        await fs.remove('/boundary-file.txt');
    });

    describe('Special path names', () => {
        it('should handle file names with dots', async () => {
            await fs.writeFile('/boundary-test/file.name.with.dots.txt', 'content');
            const exists = await fs.exists('/boundary-test/file.name.with.dots.txt');
            expect(exists.unwrap()).toBe(true);
        });

        it('should handle file names with spaces', async () => {
            await fs.writeFile('/boundary-test/file with spaces.txt', 'content');
            const exists = await fs.exists('/boundary-test/file with spaces.txt');
            expect(exists.unwrap()).toBe(true);
        });

        it('should handle file names with unicode characters', async () => {
            await fs.writeFile('/boundary-test/文件名.txt', '中文内容');
            const content = await fs.readTextFile('/boundary-test/文件名.txt');
            expect(content.unwrap()).toBe('中文内容');
        });

        it('should handle file names with emojis', async () => {
            await fs.writeFile('/boundary-test/🎉file🎉.txt', 'emoji content');
            const content = await fs.readTextFile('/boundary-test/🎉file🎉.txt');
            expect(content.unwrap()).toBe('emoji content');
        });

        it('should handle paths with parentheses', async () => {
            await fs.writeFile('/boundary-test/file(1).txt', 'content');
            const exists = await fs.exists('/boundary-test/file(1).txt');
            expect(exists.unwrap()).toBe(true);
        });

        it('should handle paths with brackets', async () => {
            await fs.writeFile('/boundary-test/file[1].txt', 'content');
            const exists = await fs.exists('/boundary-test/file[1].txt');
            expect(exists.unwrap()).toBe(true);
        });

        it('should handle very long file names', async () => {
            const longName = `${ 'a'.repeat(200) }.txt`;
            await fs.writeFile(`/boundary-test/${longName}`, 'content');
            const exists = await fs.exists(`/boundary-test/${longName}`);
            expect(exists.unwrap()).toBe(true);
        });
    });

    describe('Empty and zero-length content', () => {
        it('should write and read empty string', async () => {
            await fs.writeFile('/boundary-file.txt', '');
            const content = await fs.readTextFile('/boundary-file.txt');
            expect(content.unwrap()).toBe('');
        });

        it('should write and read empty Uint8Array', async () => {
            await fs.writeFile('/boundary-file.txt', new Uint8Array(0));
            const content = await fs.readFile('/boundary-file.txt');
            expect(content.unwrap().byteLength).toBe(0);
        });

        it('should write and read empty ArrayBuffer', async () => {
            await fs.writeFile('/boundary-file.txt', new ArrayBuffer(0));
            const content = await fs.readFile('/boundary-file.txt');
            expect(content.unwrap().byteLength).toBe(0);
        });
    });

    describe('Binary data edge cases', () => {
        it('should handle null bytes', async () => {
            const data = new Uint8Array([0, 0, 0, 0, 0]);
            await fs.writeFile('/boundary-file.txt', data);
            const content = await fs.readFile('/boundary-file.txt');
            expect(new Uint8Array(content.unwrap())).toEqual(data);
        });

        it('should handle max byte value', async () => {
            const data = new Uint8Array([255, 255, 255, 255, 255]);
            await fs.writeFile('/boundary-file.txt', data);
            const content = await fs.readFile('/boundary-file.txt');
            expect(new Uint8Array(content.unwrap())).toEqual(data);
        });

        it('should handle Uint8Array with offset', async () => {
            const buffer = new ArrayBuffer(10);
            const fullView = new Uint8Array(buffer);
            fullView.set([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);

            // Create a view with offset
            const offsetView = new Uint8Array(buffer, 2, 5);
            await fs.writeFile('/boundary-file.txt', offsetView);

            const content = await fs.readFile('/boundary-file.txt');
            const result = new Uint8Array(content.unwrap());
            expect(result).toEqual(new Uint8Array([2, 3, 4, 5, 6]));
        });
    });

    describe('Directory operations edge cases', () => {
        it('should handle creating directory at root level', async () => {
            await fs.mkdir('/boundary-test');
            const exists = await fs.exists('/boundary-test', { isDirectory: true });
            expect(exists.unwrap()).toBe(true);
        });

        it('should handle empty directory readDir', async () => {
            await fs.mkdir('/boundary-test');
            const entries = await Array.fromAsync((await fs.readDir('/boundary-test')).unwrap());
            expect(entries.length).toBe(0);
        });

        it('should handle readDir on root', async () => {
            // Create a test directory first
            await fs.mkdir('/boundary-test');
            const result = await fs.readDir('/');
            expect(result.isOk()).toBe(true);
        });
    });

    describe('Append operations', () => {
        it('should append to non-existent file', async () => {
            await fs.appendFile('/boundary-file.txt', 'first');
            const content = await fs.readTextFile('/boundary-file.txt');
            expect(content.unwrap()).toBe('first');
        });

        it('should append multiple times', async () => {
            await fs.appendFile('/boundary-file.txt', 'a');
            await fs.appendFile('/boundary-file.txt', 'b');
            await fs.appendFile('/boundary-file.txt', 'c');
            const content = await fs.readTextFile('/boundary-file.txt');
            expect(content.unwrap()).toBe('abc');
        });

        it('should append binary data', async () => {
            await fs.appendFile('/boundary-file.txt', new Uint8Array([1, 2]));
            await fs.appendFile('/boundary-file.txt', new Uint8Array([3, 4]));
            const content = await fs.readFile('/boundary-file.txt');
            expect(new Uint8Array(content.unwrap())).toEqual(new Uint8Array([1, 2, 3, 4]));
        });
    });

    describe('Concurrent operations', () => {
        it('should handle concurrent mkdir operations', async () => {
            const promises = [
                fs.mkdir('/boundary-test/a'),
                fs.mkdir('/boundary-test/b'),
                fs.mkdir('/boundary-test/c'),
            ];

            const results = await Promise.all(promises);
            results.forEach(r => expect(r.isOk()).toBe(true));
        });

        it('should handle concurrent write operations to different files', async () => {
            await fs.mkdir('/boundary-test');

            const promises = [];
            for (let i = 0; i < 20; i++) {
                promises.push(fs.writeFile(`/boundary-test/file${i}.txt`, `content ${i}`));
            }

            const results = await Promise.all(promises);
            results.forEach(r => expect(r.isOk()).toBe(true));

            const entries = await Array.fromAsync((await fs.readDir('/boundary-test')).unwrap());
            expect(entries.length).toBe(20);
        });

        it('should handle concurrent read operations', async () => {
            await fs.writeFile('/boundary-file.txt', 'shared content');

            const promises = [];
            for (let i = 0; i < 10; i++) {
                promises.push(fs.readTextFile('/boundary-file.txt'));
            }

            const results = await Promise.all(promises);
            results.forEach(r => {
                expect(r.isOk()).toBe(true);
                expect(r.unwrap()).toBe('shared content');
            });
        });
    });

    describe('Stream boundary cases', () => {
        it('should write empty content with stream', async () => {
            const result = await fs.openWritableFileStream('/boundary-file.txt');
            const stream = result.unwrap();
            await stream.close();

            const content = await fs.readFile('/boundary-file.txt');
            expect(content.unwrap().byteLength).toBe(0);
        });

        it('should write single byte with stream', async () => {
            const result = await fs.openWritableFileStream('/boundary-file.txt');
            const stream = result.unwrap();
            await stream.write(new Uint8Array([42]));
            await stream.close();

            const content = await fs.readFile('/boundary-file.txt');
            expect(new Uint8Array(content.unwrap())[0]).toBe(42);
        });
    });

    describe('JSON edge cases', () => {
        it('should handle JSON with null values', async () => {
            const data = { a: null, b: [null], c: { d: null } };
            await fs.writeJsonFile('/boundary-file.txt', data);
            const result = await fs.readJsonFile('/boundary-file.txt');
            expect(result.unwrap()).toEqual(data);
        });

        it('should handle JSON with empty array', async () => {
            const data: unknown[] = [];
            await fs.writeJsonFile('/boundary-file.txt', data);
            const result = await fs.readJsonFile('/boundary-file.txt');
            expect(result.unwrap()).toEqual([]);
        });

        it('should handle JSON with empty object', async () => {
            const data = {};
            await fs.writeJsonFile('/boundary-file.txt', data);
            const result = await fs.readJsonFile('/boundary-file.txt');
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
            await fs.writeJsonFile('/boundary-file.txt', data);
            const result = await fs.readJsonFile('/boundary-file.txt');
            expect(result.unwrap()).toEqual(data);
        });

        it('should handle JSON with boolean values', async () => {
            const data = { trueVal: true, falseVal: false };
            await fs.writeJsonFile('/boundary-file.txt', data);
            const result = await fs.readJsonFile('/boundary-file.txt');
            expect(result.unwrap()).toEqual(data);
        });
    });

    describe('Copy/Move with nested structures', () => {
        it('should copy deeply nested directory structure', async () => {
            // Create nested structure
            await fs.mkdir('/boundary-test/src/a/b/c');
            await fs.writeFile('/boundary-test/src/a/file1.txt', 'content1');
            await fs.writeFile('/boundary-test/src/a/b/file2.txt', 'content2');
            await fs.writeFile('/boundary-test/src/a/b/c/file3.txt', 'content3');

            // Copy
            const result = await fs.copy('/boundary-test/src', '/boundary-test/dest');
            expect(result.isOk()).toBe(true);

            // Verify structure
            expect((await fs.exists('/boundary-test/dest/a/b/c', { isDirectory: true })).unwrap()).toBe(true);
            expect((await fs.readTextFile('/boundary-test/dest/a/file1.txt')).unwrap()).toBe('content1');
            expect((await fs.readTextFile('/boundary-test/dest/a/b/file2.txt')).unwrap()).toBe('content2');
            expect((await fs.readTextFile('/boundary-test/dest/a/b/c/file3.txt')).unwrap()).toBe('content3');
        });

        it('should move file to nested path that does not exist', async () => {
            await fs.writeFile('/boundary-test/src.txt', 'content');

            const result = await fs.move('/boundary-test/src.txt', '/boundary-test/deep/nested/dest.txt');
            expect(result.isOk()).toBe(true);

            expect((await fs.exists('/boundary-test/src.txt')).unwrap()).toBe(false);
            expect((await fs.readTextFile('/boundary-test/deep/nested/dest.txt')).unwrap()).toBe('content');
        });
    });
});
