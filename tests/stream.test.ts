/**
 * Stream-based file operations tests using Vitest
 * Tests: readFile with stream encoding, openWritableFileStream
 */
import { afterEach, describe, expect, it } from 'vitest';
import * as fs from '../src/mod.ts';

describe('OPFS Stream Operations', () => {
    afterEach(async () => {
        await fs.remove('/stream-read.txt');
        await fs.remove('/stream-large.bin');
        await fs.remove('/stream-write.txt');
        await fs.remove('/stream-write-bin.bin');
        await fs.remove('/stream-append.txt');
        await fs.remove('/stream-nested');
        await fs.remove('/stream-interrupt.bin');
    });

    describe('readFile stream encoding', () => {
        it('should read file as a stream', async () => {
            const content = 'Hello, Stream World!';
            await fs.writeFile('/stream-read.txt', content);

            const result = await fs.readFile('/stream-read.txt', { encoding: 'stream' });
            const stream = result.unwrap();

            // Read from stream
            const reader = stream.getReader();
            const chunks: Uint8Array[] = [];

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                chunks.push(value);
            }

            // Combine chunks and verify
            const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
            const combined = new Uint8Array(totalLength);
            let offset = 0;
            for (const chunk of chunks) {
                combined.set(chunk, offset);
                offset += chunk.length;
            }

            const decoded = new TextDecoder().decode(combined);
            expect(decoded).toBe(content);
        });

        it('should handle large file streaming', async () => {
            // Create a 1MB file
            const size = 1024 * 1024;
            const data = new Uint8Array(size);
            for (let i = 0; i < size; i++) {
                data[i] = i % 256;
            }
            await fs.writeFile('/stream-large.bin', data);

            const result = await fs.readFile('/stream-large.bin', { encoding: 'stream' });
            const stream = result.unwrap();

            const reader = stream.getReader();
            let totalBytes = 0;

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                totalBytes += value.length;
            }

            expect(totalBytes).toBe(size);
        });

        it('should fail for non-existent file', async () => {
            const result = await fs.readFile('/non-existent-stream.txt', { encoding: 'stream' });
            expect(result.isErr()).toBe(true);
        });
    });

    describe('openWritableFileStream', () => {
        it('should write file using stream', async () => {
            const result = await fs.openWritableFileStream('/stream-write.txt');
            const stream = result.unwrap();

            try {
                await stream.write('Hello, ');
                await stream.write('Stream ');
                await stream.write('Write!');
            } finally {
                await stream.close();
            }

            const content = await fs.readTextFile('/stream-write.txt');
            expect(content.unwrap()).toBe('Hello, Stream Write!');
        });

        it('should write binary data using stream', async () => {
            const result = await fs.openWritableFileStream('/stream-write-bin.bin');
            const stream = result.unwrap();

            try {
                await stream.write(new Uint8Array([1, 2, 3]));
                await stream.write(new Uint8Array([4, 5, 6]));
            } finally {
                await stream.close();
            }

            const data = await fs.readFile('/stream-write-bin.bin');
            const buffer = data.unwrap();
            expect(buffer.byteLength).toBe(6);

            const arr = new Uint8Array(buffer);
            expect(arr[0]).toBe(1);
            expect(arr[5]).toBe(6);
        });

        it('should append using stream', async () => {
            await fs.writeFile('/stream-append.txt', 'Initial');

            const result = await fs.openWritableFileStream('/stream-append.txt', { append: true });
            const stream = result.unwrap();

            try {
                await stream.write(' Appended');
            } finally {
                await stream.close();
            }

            const content = await fs.readTextFile('/stream-append.txt');
            expect(content.unwrap()).toBe('Initial Appended');
        });

        it('should create file and parent directories', async () => {
            const result = await fs.openWritableFileStream('/stream-nested/dir/file.txt');
            const stream = result.unwrap();

            try {
                await stream.write('Nested stream content');
            } finally {
                await stream.close();
            }

            expect((await fs.exists('/stream-nested/dir/file.txt')).unwrap()).toBe(true);
        });

        it('should fail when create is false and file does not exist', async () => {
            const result = await fs.openWritableFileStream('/non-existent-stream-write.txt', { create: false });
            expect(result.isErr()).toBe(true);
        });
    });

    describe('writeFile with interrupted stream', () => {
        it('should not leave incomplete file when stream errors on new file', async () => {
            const filePath = '/stream-interrupt-new.bin';

            // Ensure file does not exist before test
            await fs.remove(filePath);

            // Create a stream that errors after sending some data
            const interruptedStream = new ReadableStream<Uint8Array<ArrayBuffer>>({
                async start(controller) {
                    // Send first chunk
                    controller.enqueue(new TextEncoder().encode('chunk-1-data-'));

                    // Small delay
                    await new Promise(resolve => setTimeout(resolve, 10));

                    // Send second chunk
                    controller.enqueue(new TextEncoder().encode('chunk-2-data-'));

                    // Simulate error mid-stream
                    controller.error(new Error('Stream interrupted'));
                },
            });

            // Write the interrupted stream
            const writeRes = await fs.writeFile(filePath, interruptedStream);

            // Write should fail
            expect(writeRes.isErr()).toBe(true);

            // With temp file strategy: incomplete file should NOT be left on disk
            const existsRes = await fs.exists(filePath);
            expect(existsRes.unwrap()).toBe(false);
        });

        it('preserves existing file content when stream errors during overwrite', async () => {
            const filePath = '/stream-interrupt.bin';
            const originalContent = 'This is the original file content that should be preserved';

            // Create file with original content
            await fs.writeFile(filePath, originalContent);

            // Create a stream that errors after sending some data
            const interruptedStream = new ReadableStream<Uint8Array<ArrayBuffer>>({
                async start(controller) {
                    controller.enqueue(new TextEncoder().encode('partial'));
                    await new Promise(resolve => setTimeout(resolve, 10));
                    controller.error(new Error('Stream interrupted'));
                },
            });

            // Try to overwrite with interrupted stream
            const writeRes = await fs.writeFile(filePath, interruptedStream);
            expect(writeRes.isErr()).toBe(true);

            // Check file state after failed write
            const afterContent = await fs.readTextFile(filePath);
            const content = afterContent.unwrap();

            // Actual behavior: FileSystemWritableFileStream preserves original content
            // because it uses transactional writes (only commits on close)
            expect(content).toBe(originalContent);
        });

        it('preserves existing file content when stream errors during append', async () => {
            const filePath = '/stream-interrupt.bin';
            const originalContent = 'Original content';

            // Create file with original content
            await fs.writeFile(filePath, originalContent);

            // Create a stream that errors after sending some data
            const interruptedStream = new ReadableStream<Uint8Array<ArrayBuffer>>({
                async start(controller) {
                    controller.enqueue(new TextEncoder().encode('-appended'));
                    await new Promise(resolve => setTimeout(resolve, 10));
                    controller.error(new Error('Stream interrupted'));
                },
            });

            // Try to append with interrupted stream
            const writeRes = await fs.writeFile(filePath, interruptedStream, { append: true });
            expect(writeRes.isErr()).toBe(true);

            // FileSystemWritableFileStream uses transactional writes
            // Original content is preserved on failed append
            const afterContent = await fs.readTextFile(filePath);
            expect(afterContent.unwrap()).toBe(originalContent);
        });
    });
});
