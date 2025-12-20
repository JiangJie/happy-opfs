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
    });

    describe('File Content Edge Cases', () => {
        it('should handle empty file', async () => {
            await fs.writeFile('/edge-file.txt', '');
            
            const content = await fs.readTextFile('/edge-file.txt');
            expect(content.unwrap()).toBe('');
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
    });

    describe('Directory Edge Cases', () => {
        it('should handle deeply nested directories', async () => {
            const deepPath = '/edge-dir/a/b/c/d/e/f/g/h/i/j';
            await fs.mkdir(deepPath);
            
            expect((await fs.exists(deepPath, { isDirectory: true })).unwrap()).toBe(true);
        });

        it('should handle empty directory', async () => {
            await fs.mkdir('/edge-dir');
            
            const entries = await Array.fromAsync((await fs.readDir('/edge-dir')).unwrap());
            expect(entries.length).toBe(0);
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
    });

    describe('Stream Edge Cases', () => {
        it('should handle multiple write operations', async () => {
            const result = await fs.writeFileStream('/edge-file.txt');
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
    });
});
