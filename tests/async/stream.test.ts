/**
 * Tests for stream-based file operations: readFileStream, writeFileStream
 */
import * as fs from '../../src/mod.ts';
import { assert, assertEqual, assertErr, assertOk, describe, test } from '../test-utils.ts';

export async function testStream(): Promise<void> {
    await describe('Stream - readFileStream', async () => {
        await test('should read file as a stream', async () => {
            const content = 'Hello, Stream World!';
            await fs.writeFile('/stream-read.txt', content);

            const result = await fs.readFileStream('/stream-read.txt');
            const stream = assertOk(result);

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
            assertEqual(decoded, content);

            await fs.remove('/stream-read.txt');
        });

        await test('should handle large file streaming', async () => {
            // Create a 1MB file
            const size = 1024 * 1024;
            const data = new Uint8Array(size);
            for (let i = 0; i < size; i++) {
                data[i] = i % 256;
            }
            await fs.writeFile('/stream-large.bin', data);

            const result = await fs.readFileStream('/stream-large.bin');
            const stream = assertOk(result);

            const reader = stream.getReader();
            let totalBytes = 0;

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                totalBytes += value.length;
            }

            assertEqual(totalBytes, size);

            await fs.remove('/stream-large.bin');
        });

        await test('should fail for non-existent file', async () => {
            const result = await fs.readFileStream('/non-existent-stream.txt');
            assertErr(result);
        });
    });

    await describe('Stream - writeFileStream', async () => {
        await test('should write file using stream', async () => {
            const result = await fs.writeFileStream('/stream-write.txt');
            const stream = assertOk(result);

            try {
                await stream.write('Hello, ');
                await stream.write('Stream ');
                await stream.write('Write!');
            } finally {
                await stream.close();
            }

            const content = await fs.readTextFile('/stream-write.txt');
            assertEqual(assertOk(content), 'Hello, Stream Write!');

            await fs.remove('/stream-write.txt');
        });

        await test('should write binary data using stream', async () => {
            const result = await fs.writeFileStream('/stream-write-bin.bin');
            const stream = assertOk(result);

            try {
                await stream.write(new Uint8Array([1, 2, 3]));
                await stream.write(new Uint8Array([4, 5, 6]));
            } finally {
                await stream.close();
            }

            const data = await fs.readFile('/stream-write-bin.bin');
            const buffer = assertOk(data);
            assertEqual(buffer.byteLength, 6);

            const arr = new Uint8Array(buffer);
            assertEqual(arr[0], 1);
            assertEqual(arr[5], 6);

            await fs.remove('/stream-write-bin.bin');
        });

        await test('should append using stream', async () => {
            await fs.writeFile('/stream-append.txt', 'Initial');

            const result = await fs.writeFileStream('/stream-append.txt', { append: true });
            const stream = assertOk(result);

            try {
                await stream.write(' Appended');
            } finally {
                await stream.close();
            }

            const content = await fs.readTextFile('/stream-append.txt');
            assertEqual(assertOk(content), 'Initial Appended');

            await fs.remove('/stream-append.txt');
        });

        await test('should create file and parent directories', async () => {
            const result = await fs.writeFileStream('/stream-nested/dir/file.txt');
            const stream = assertOk(result);

            try {
                await stream.write('Nested stream content');
            } finally {
                await stream.close();
            }

            assert(assertOk(await fs.exists('/stream-nested/dir/file.txt')));

            await fs.remove('/stream-nested');
        });

        await test('should fail when create is false and file does not exist', async () => {
            const result = await fs.writeFileStream('/non-existent-stream-write.txt', { create: false });
            assertErr(result);
        });
    });
}
