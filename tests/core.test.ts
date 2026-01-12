/**
 * Core OPFS operations tests using Vitest
 * Tests: createFile, mkdir, readDir, readFile, writeFile, remove, stat
 */
import { afterEach, describe, expect, it } from 'vitest';
import * as fs from '../src/mod.ts';

describe('OPFS Core Operations', () => {
    // Clean up test files after each test
    afterEach(async () => {
        await fs.remove('/test-file.txt');
        await fs.remove('/test-dir');
        await fs.remove('/nested');
        await fs.remove('/existing-file.txt');
        await fs.remove('/existing-dir');
        await fs.remove('/test-readdir');
        await fs.remove('/test-readdir-recursive');
        await fs.remove('/test-stat-file.txt');
        await fs.remove('/test-stat-dir');
    });

    describe('createFile', () => {
        it('should create a new empty file', async () => {
            const result = await fs.createFile('/test-file.txt');
            expect(result.isOk()).toBe(true);

            const exists = await fs.exists('/test-file.txt');
            expect(exists.isOk()).toBe(true);
            expect(exists.unwrap()).toBe(true);
        });

        it('should create file with nested directories', async () => {
            const result = await fs.createFile('/nested/dir/file.txt');
            expect(result.isOk()).toBe(true);

            const exists = await fs.exists('/nested/dir/file.txt');
            expect(exists.isOk()).toBe(true);
            expect(exists.unwrap()).toBe(true);
        });

        it('should succeed if file already exists', async () => {
            await fs.writeFile('/existing-file.txt', 'content');
            const result = await fs.createFile('/existing-file.txt');
            expect(result.isOk()).toBe(true);

            // Content should remain unchanged
            const content = await fs.readTextFile('/existing-file.txt');
            expect(content.unwrap()).toBe('content');
        });
    });

    describe('mkdir', () => {
        it('should create a new directory', async () => {
            const result = await fs.mkdir('/test-dir');
            expect(result.isOk()).toBe(true);

            const exists = await fs.exists('/test-dir', { isDirectory: true });
            expect(exists.isOk()).toBe(true);
            expect(exists.unwrap()).toBe(true);
        });

        it('should create nested directories (mkdir -p)', async () => {
            const result = await fs.mkdir('/nested/a//b/c/d');
            expect(result.isOk()).toBe(true);

            const exists = await fs.exists('/nested/a/b/c/d', { isDirectory: true });
            expect(exists.isOk()).toBe(true);
            expect(exists.unwrap()).toBe(true);
        });

        it('should succeed if directory already exists', async () => {
            await fs.mkdir('/existing-dir');
            const result = await fs.mkdir('/existing-dir');
            expect(result.isOk()).toBe(true);
        });
    });

    describe('writeFile & readFile', () => {
        it('should write and read string content', async () => {
            const content = 'Hello, OPFS!';
            const writeResult = await fs.writeFile('/test-file.txt', content);
            expect(writeResult.isOk()).toBe(true);

            const readResult = await fs.readTextFile('/test-file.txt');
            expect(readResult.isOk()).toBe(true);
            expect(readResult.unwrap()).toBe(content);
        });

        it('should write and read binary content', async () => {
            const data = new Uint8Array([1, 2, 3, 4, 5]);
            const writeResult = await fs.writeFile('/test-file.txt', data);
            expect(writeResult.isOk()).toBe(true);

            const readResult = await fs.readFile('/test-file.txt');
            expect(readResult.isOk()).toBe(true);
            const buffer = readResult.unwrap();
            expect(buffer.byteLength).toBe(5);
            expect(new Uint8Array(buffer)[0]).toBe(1);
        });

        it('should read file as Uint8Array with bytes encoding', async () => {
            const data = new Uint8Array([10, 20, 30, 40, 50]);
            await fs.writeFile('/test-file.txt', data);

            const readResult = await fs.readFile('/test-file.txt', { encoding: 'bytes' });
            expect(readResult.isOk()).toBe(true);
            const bytes = readResult.unwrap();
            expect(bytes).toBeInstanceOf(Uint8Array);
            expect(bytes.length).toBe(5);
            expect(bytes[0]).toBe(10);
            expect(bytes[4]).toBe(50);
        });

        it('should write and read Blob content', async () => {
            const blob = new Blob(['Blob content'], { type: 'text/plain' });
            await fs.writeFile('/test-file.txt', blob);

            const result = await fs.readFile('/test-file.txt', { encoding: 'blob' });
            const file = result.unwrap();
            expect(file.size).toBe(12);
        });

        it('should append content to existing file', async () => {
            await fs.writeFile('/test-file.txt', 'Hello');
            await fs.writeFile('/test-file.txt', ' World', { append: true });

            const result = await fs.readTextFile('/test-file.txt');
            expect(result.unwrap()).toBe('Hello World');
        });

        it('should overwrite (truncate) existing file when writing ReadableStream', async () => {
            await fs.writeFile('/test-file.txt', 'THIS IS LONGER');

            const enc = new TextEncoder();
            const stream = new ReadableStream<Uint8Array<ArrayBuffer>>({
                start(controller) {
                    controller.enqueue(enc.encode('Short') as Uint8Array<ArrayBuffer>);
                    controller.close();
                },
            });

            const writeResult = await fs.writeFile('/test-file.txt', stream);
            expect(writeResult.isOk()).toBe(true);

            const readResult = await fs.readTextFile('/test-file.txt');
            expect(readResult.unwrap()).toBe('Short');
        });

        it('should append when writing ReadableStream with { append: true }', async () => {
            await fs.writeFile('/test-file.txt', 'Hello');

            const enc = new TextEncoder();
            const stream = new ReadableStream<Uint8Array<ArrayBuffer>>({
                start(controller) {
                    controller.enqueue(enc.encode(' World') as Uint8Array<ArrayBuffer>);
                    controller.close();
                },
            });

            const writeResult = await fs.writeFile('/test-file.txt', stream, { append: true });
            expect(writeResult.isOk()).toBe(true);

            const readResult = await fs.readTextFile('/test-file.txt');
            expect(readResult.unwrap()).toBe('Hello World');
        });

        it('should return an empty ReadableStream for empty file when encoding is stream', async () => {
            // Create an empty file
            const createResult = await fs.createFile('/test-file.txt');
            expect(createResult.isOk()).toBe(true);

            const readResult = await fs.readFile('/test-file.txt', { encoding: 'stream' });
            expect(readResult.isOk()).toBe(true);

            const stream = readResult.unwrap();
            expect(stream).toBeInstanceOf(ReadableStream);

            const reader = stream.getReader();
            const { done, value } = await reader.read();
            expect(done).toBe(true);
            expect(value).toBeUndefined();
            reader.releaseLock();
        });

        it('should fail to write when create is false and file does not exist', async () => {
            const result = await fs.writeFile('/non-existent.txt', 'content', { create: false });
            expect(result.isErr()).toBe(true);
        });

        it('should fail to read non-existent file', async () => {
            const result = await fs.readFile('/non-existent-file.txt');
            expect(result.isErr()).toBe(true);
        });
    });

    describe('readDir', () => {
        it('should read directory entries', async () => {
            await fs.mkdir('/test-readdir');
            await fs.writeFile('/test-readdir/file1.txt', 'a');
            await fs.writeFile('/test-readdir/file2.txt', 'b');
            await fs.mkdir('/test-readdir/subdir');

            const result = await fs.readDir('/test-readdir');
            const entries = await Array.fromAsync(result.unwrap());
            expect(entries.length).toBe(3);
        });

        it('should read directory recursively', async () => {
            await fs.mkdir('/test-readdir-recursive/sub1');
            await fs.mkdir('/test-readdir-recursive/sub2');
            await fs.writeFile('/test-readdir-recursive/file.txt', 'root');
            await fs.writeFile('/test-readdir-recursive/sub1/file.txt', 'sub1');
            await fs.writeFile('/test-readdir-recursive/sub2/file.txt', 'sub2');

            const result = await fs.readDir('/test-readdir-recursive', { recursive: true });
            const entries = await Array.fromAsync(result.unwrap());

            // sub1, sub2, file.txt, sub1/file.txt, sub2/file.txt
            expect(entries.length).toBe(5);
        });

        it('should fail to read non-existent directory', async () => {
            const result = await fs.readDir('/non-existent-dir');
            expect(result.isErr()).toBe(true);
        });

        it('should return Err when signal is aborted before start', async () => {
            await fs.mkdir('/test-readdir-abort');
            await fs.writeFile('/test-readdir-abort/file1.txt', 'a');
            await fs.writeFile('/test-readdir-abort/file2.txt', 'b');

            const controller = new AbortController();
            controller.abort(); // Abort before iteration

            const result = await fs.readDir('/test-readdir-abort', { signal: controller.signal });
            expect(result.isErr()).toBe(true);
            expect(result.unwrapErr().name).toBe('AbortError');
        });

        it('should stop iteration when signal is aborted during traversal', async () => {
            await fs.mkdir('/test-readdir-abort-mid');
            await fs.writeFile('/test-readdir-abort-mid/file1.txt', 'a');
            await fs.writeFile('/test-readdir-abort-mid/file2.txt', 'b');
            await fs.writeFile('/test-readdir-abort-mid/file3.txt', 'c');

            const controller = new AbortController();
            const result = await fs.readDir('/test-readdir-abort-mid', { signal: controller.signal });

            const entries: fs.DirEntry[] = [];
            for await (const entry of result.unwrap()) {
                entries.push(entry);
                if (entries.length === 1) {
                    controller.abort(); // Abort after first entry
                }
            }

            // Should have stopped after 1 entry (the abort check happens before each yield)
            expect(entries.length).toBe(1);
        });

        it('should work with AbortSignal.timeout()', async () => {
            await fs.mkdir('/test-readdir-timeout');
            await fs.writeFile('/test-readdir-timeout/file1.txt', 'a');

            // Use a long timeout - operation should complete before timeout
            const signal = AbortSignal.timeout(5000);
            const result = await fs.readDir('/test-readdir-timeout', { signal });
            const entries = await Array.fromAsync(result.unwrap());

            expect(entries.length).toBe(1);
            expect(signal.aborted).toBe(false);
        });

        it('should return Err with already-timed-out signal', async () => {
            await fs.mkdir('/test-readdir-timeout-expired');
            await fs.writeFile('/test-readdir-timeout-expired/file1.txt', 'a');

            // Create signal with 0ms timeout and wait for it to expire
            const signal = AbortSignal.timeout(0);
            await new Promise(resolve => setTimeout(resolve, 10));

            expect(signal.aborted).toBe(true);

            const result = await fs.readDir('/test-readdir-timeout-expired', { signal });
            expect(result.isErr()).toBe(true);
            expect(result.unwrapErr().name).toBe('TimeoutError');
        });
    });

    describe('stat', () => {
        it('should return file handle for file', async () => {
            await fs.writeFile('/test-stat-file.txt', 'content');

            const result = await fs.stat('/test-stat-file.txt');
            const handle = result.unwrap();
            expect(fs.isFileHandle(handle)).toBe(true);
            expect(handle.name).toBe('test-stat-file.txt');
        });

        it('should return directory handle for directory', async () => {
            await fs.mkdir('/test-stat-dir');

            const result = await fs.stat('/test-stat-dir');
            const handle = result.unwrap();
            expect(fs.isDirectoryHandle(handle)).toBe(true);
            expect(handle.name).toBe('test-stat-dir');
        });

        it('should fail for non-existent path', async () => {
            const result = await fs.stat('/non-existent-path');
            expect(result.isErr()).toBe(true);
        });
    });

    describe('remove', () => {
        it('should remove a file', async () => {
            await fs.writeFile('/test-file.txt', 'content');
            const result = await fs.remove('/test-file.txt');
            expect(result.isOk()).toBe(true);

            const exists = await fs.exists('/test-file.txt');
            expect(exists.unwrap()).toBe(false);
        });

        it('should remove a directory recursively', async () => {
            await fs.mkdir('/test-dir/sub');
            await fs.writeFile('/test-dir/file.txt', 'a');
            await fs.writeFile('/test-dir/sub/file.txt', 'b');

            const result = await fs.remove('/test-dir');
            expect(result.isOk()).toBe(true);

            const exists = await fs.exists('/test-dir');
            expect(exists.unwrap()).toBe(false);
        });

        it('should succeed for non-existent path', async () => {
            const result = await fs.remove('/definitely-not-exists');
            expect(result.isOk()).toBe(true);
        });

        it('should return error when parent path is a file (TypeMismatchError)', async () => {
            // Create a file
            await fs.writeFile('/test-file.txt', 'content');

            // Try to remove a child of the file (which is impossible)
            // This causes getDirHandle to fail with TypeMismatchError
            const result = await fs.remove('/test-file.txt/child');
            expect(result.isErr()).toBe(true);
            expect(result.unwrapErr().name).toBe('TypeMismatchError');
        });

        it('should remove root directory contents', async () => {
            // Create some test files and directories
            await fs.writeFile('/root-test-file.txt', 'test');
            await fs.mkdir('/root-test-dir');
            await fs.writeFile('/root-test-dir/nested.txt', 'nested');

            // Verify files exist
            expect((await fs.exists('/root-test-file.txt')).unwrap()).toBe(true);
            expect((await fs.exists('/root-test-dir')).unwrap()).toBe(true);

            // Remove root directory (clears all contents)
            const result = await fs.remove('/');
            expect(result.isOk()).toBe(true);

            // Verify files are removed
            expect((await fs.exists('/root-test-file.txt')).unwrap()).toBe(false);
            expect((await fs.exists('/root-test-dir')).unwrap()).toBe(false);
        });
    });

    describe('exists', () => {
        it('should return true for existing file', async () => {
            await fs.writeFile('/test-file.txt', 'content');
            const exists = await fs.exists('/test-file.txt');
            expect(exists.unwrap()).toBe(true);
        });

        it('should return true for existing directory', async () => {
            await fs.mkdir('/test-dir');
            const exists = await fs.exists('/test-dir');
            expect(exists.unwrap()).toBe(true);
        });

        it('should return false for non-existent path', async () => {
            const exists = await fs.exists('/non-existent.txt');
            expect(exists.unwrap()).toBe(false);
        });

        it('should check isFile option', async () => {
            await fs.writeFile('/test-file.txt', 'content');
            await fs.mkdir('/test-dir');

            expect((await fs.exists('/test-file.txt', { isFile: true })).unwrap()).toBe(true);
            expect((await fs.exists('/test-dir', { isFile: true })).unwrap()).toBe(false);
        });

        it('should check isDirectory option', async () => {
            await fs.writeFile('/test-file.txt', 'content');
            await fs.mkdir('/test-dir');

            expect((await fs.exists('/test-file.txt', { isDirectory: true })).unwrap()).toBe(false);
            expect((await fs.exists('/test-dir', { isDirectory: true })).unwrap()).toBe(true);
        });
    });
});
