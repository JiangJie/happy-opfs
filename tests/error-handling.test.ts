/**
 * Error handling and edge cases tests using Vitest
 * Tests various error conditions and boundary cases across modules
 */
import { afterEach, describe, expect, it } from 'vitest';
import * as fs from '../src/mod.ts';

describe('Error Handling', () => {
    afterEach(async () => {
        await fs.remove('/error-test');
        await fs.remove('/error-file.txt');
        await fs.remove('/error-dir');
    });

    describe('Read operations on non-existent paths', () => {
        it('should return Err for reading non-existent file', async () => {
            const result = await fs.readFile('/non-existent-xyz.txt');
            expect(result.isErr()).toBe(true);
        });

        it('should return Err for reading non-existent file as text', async () => {
            const result = await fs.readTextFile('/non-existent-xyz.txt');
            expect(result.isErr()).toBe(true);
        });

        it('should return Err for reading non-existent file as blob', async () => {
            const result = await fs.readBlobFile('/non-existent-xyz.txt');
            expect(result.isErr()).toBe(true);
        });

        it('should return Err for reading non-existent JSON file', async () => {
            const result = await fs.readJsonFile('/non-existent-xyz.json');
            expect(result.isErr()).toBe(true);
        });

        it('should return Err for reading non-existent directory', async () => {
            const result = await fs.readDir('/non-existent-dir-xyz');
            expect(result.isErr()).toBe(true);
        });

        it('should return Err for reading stream from non-existent file', async () => {
            const result = await fs.readFile('/non-existent-xyz.txt', { encoding: 'stream' });
            expect(result.isErr()).toBe(true);
        });
    });

    describe('Write operations with create: false', () => {
        it('should fail writeFile when create is false and file does not exist', async () => {
            const result = await fs.writeFile('/error-test/non-existent.txt', 'content', { create: false });
            expect(result.isErr()).toBe(true);
        });

        it('should fail openWritableFileStream when create is false and file does not exist', async () => {
            const result = await fs.openWritableFileStream('/error-test/non-existent.txt', { create: false });
            expect(result.isErr()).toBe(true);
        });

        it('should fail writeFile(ReadbleStream) when create is false and file does not exist', async () => {
            const enc = new TextEncoder();
            const stream = new ReadableStream<Uint8Array<ArrayBuffer>>({
                start(controller) {
                    controller.enqueue(enc.encode('content') as Uint8Array<ArrayBuffer>);
                    controller.close();
                },
            });

            const result = await fs.writeFile('/error-test/non-existent.txt', stream, { create: false });
            expect(result.isErr()).toBe(true);
        });
    });

    describe('Stat operations', () => {
        it('should return Err for non-existent path', async () => {
            const result = await fs.stat('/non-existent-path-xyz');
            expect(result.isErr()).toBe(true);
        });

        it('should get stat for root directory', async () => {
            const result = await fs.stat('/');
            expect(result.isOk()).toBe(true);
            expect(fs.isDirectoryHandle(result.unwrap())).toBe(true);
        });
    });

    describe('Copy/Move type mismatch errors', () => {
        it('should fail copy when source is file and dest is directory', async () => {
            await fs.writeFile('/error-file.txt', 'file content');
            await fs.mkdir('/error-dir');

            const result = await fs.copy('/error-file.txt', '/error-dir');
            expect(result.isErr()).toBe(true);
        });

        it('should fail copy when source is directory and dest is file', async () => {
            await fs.mkdir('/error-dir');
            await fs.writeFile('/error-file.txt', 'file content');

            const result = await fs.copy('/error-dir', '/error-file.txt');
            expect(result.isErr()).toBe(true);
        });

        it('should fail move when source is file and dest is directory', async () => {
            await fs.writeFile('/error-file.txt', 'file content');
            await fs.mkdir('/error-dir');

            const result = await fs.move('/error-file.txt', '/error-dir');
            expect(result.isErr()).toBe(true);
        });
    });

    describe('JSON parsing errors', () => {
        it('should return Err when reading invalid JSON', async () => {
            await fs.writeFile('/error-file.txt', 'not valid json {{{');
            const result = await fs.readJsonFile('/error-file.txt');
            expect(result.isErr()).toBe(true);
        });

        it('should handle empty file as invalid JSON', async () => {
            await fs.writeFile('/error-file.txt', '');
            const result = await fs.readJsonFile('/error-file.txt');
            expect(result.isErr()).toBe(true);
        });
    });

    describe('Exists edge cases', () => {
        it('should handle root directory exists check', async () => {
            const result = await fs.exists('////');
            expect(result.isOk()).toBe(true);
            expect(result.unwrap()).toBe(true);
        });

        it('should return false for definitely non-existent path', async () => {
            const result = await fs.exists('/definitely-not-exists-xyz-123');
            expect(result.isOk()).toBe(true);
            expect(result.unwrap()).toBe(false);
        });

        it('should correctly check isFile for directory', async () => {
            await fs.mkdir('/error-dir');
            const result = await fs.exists('/error-dir', { isFile: true });
            expect(result.isOk()).toBe(true);
            expect(result.unwrap()).toBe(false);
        });

        it('should correctly check isDirectory for file', async () => {
            await fs.writeFile('/error-file.txt', 'content');
            const result = await fs.exists('/error-file.txt', { isDirectory: true });
            expect(result.isOk()).toBe(true);
            expect(result.unwrap()).toBe(false);
        });
    });

    describe('Remove edge cases', () => {
        it('should succeed when removing non-existent path', async () => {
            const result = await fs.remove('/definitely-not-exists-xyz');
            expect(result.isOk()).toBe(true);
        });

        it('should remove root directory contents', async () => {
            // This tests the root removal path in the code
            await fs.mkdir('/error-test');
            await fs.writeFile('/error-test/file.txt', 'content');
            const result = await fs.remove('/error-test');
            expect(result.isOk()).toBe(true);
        });
    });

    describe('Zip/Unzip errors', () => {
        it('should fail to zip non-existent path', async () => {
            const result = await fs.zip('/non-existent-xyz');
            expect(result.isErr()).toBe(true);
        });

        it('should fail to unzip non-existent file', async () => {
            const result = await fs.unzip('/non-existent-xyz.zip', '/error-test');
            expect(result.isErr()).toBe(true);
        });
    });

    describe('Temp operations errors', () => {
        it('should handle pruneTemp with invalid date', async () => {
            // pruneTemp requires a Date, should return Err for invalid input
            // @ts-expect-error Testing invalid input
            const result = await fs.pruneTemp('not-a-date');
            expect(result.isErr()).toBe(true);
            expect(result.unwrapErr()).toBeInstanceOf(TypeError);
        });

        it('should succeed deleteTemp when tmp dir does not exist', async () => {
            await fs.remove(fs.TMP_DIR);
            const result = await fs.deleteTemp();
            expect(result.isOk()).toBe(true);
        });
    });
});
