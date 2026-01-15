import { describe, it, expect } from 'vitest';
import * as fs from '../src/mod.ts';
import { peekStream } from '../src/async/internal/mod.ts';

describe('Stream Error Handling', () => {
    it('should handle stream that throws error in start()', async () => {
        const errorStream = new ReadableStream<Uint8Array<ArrayBuffer>>({
            start(controller) {
                controller.enqueue(new Uint8Array([1, 2, 3]) as Uint8Array<ArrayBuffer>);
                controller.error(new Error('Stream error in start'));
            },
        });

        const result = await fs.writeFile('/test-error-stream.bin', errorStream);
        expect(result.isErr()).toBe(true);
        expect(result.unwrapErr().message).toBe('Stream error in start');
    });

    it('should handle stream that throws error in pull()', async () => {
        let pullCount = 0;
        const errorStream = new ReadableStream<Uint8Array<ArrayBuffer>>({
            pull(controller) {
                pullCount++;
                if (pullCount === 1) {
                    controller.enqueue(new Uint8Array([1, 2, 3]) as Uint8Array<ArrayBuffer>);
                } else {
                    controller.error(new Error('Stream error in pull'));
                }
            },
        });

        const result = await fs.writeFile('/test-error-stream-pull.bin', errorStream);
        expect(result.isErr()).toBe(true);
        expect(result.unwrapErr().message).toBe('Stream error in pull');
    });

    it('should handle async start() that rejects', async () => {
        const errorStream = new ReadableStream<Uint8Array<ArrayBuffer>>({
            async start() {
                throw new Error('Async start rejection');
            },
        });

        const result = await fs.writeFile('/test-error-stream-async-start.bin', errorStream);
        expect(result.isErr()).toBe(true);
        expect(result.unwrapErr().message).toBe('Async start rejection');
    });

    it('should handle async pull() that rejects', async () => {
        let pullCount = 0;
        const errorStream = new ReadableStream<Uint8Array<ArrayBuffer>>({
            async pull(controller) {
                pullCount++;
                if (pullCount === 1) {
                    controller.enqueue(new Uint8Array([1, 2, 3]) as Uint8Array<ArrayBuffer>);
                } else {
                    throw new Error('Async pull rejection');
                }
            },
        });

        const result = await fs.writeFile('/test-error-stream-async-pull.bin', errorStream);
        expect(result.isErr()).toBe(true);
        expect(result.unwrapErr().message).toBe('Async pull rejection');
    });

    it('should handle async start() with controller.error()', async () => {
        const errorStream = new ReadableStream<Uint8Array<ArrayBuffer>>({
            async start(controller) {
                controller.enqueue(new Uint8Array([1, 2, 3]) as Uint8Array<ArrayBuffer>);
                controller.error(new Error('Async start controller error'));
            },
        });

        const result = await fs.writeFile('/test-error-stream-async-start-ctrl.bin', errorStream);
        expect(result.isErr()).toBe(true);
        expect(result.unwrapErr().message).toBe('Async start controller error');
    });

    it('should handle async pull() with controller.error()', async () => {
        let pullCount = 0;
        const errorStream = new ReadableStream<Uint8Array<ArrayBuffer>>({
            async pull(controller) {
                pullCount++;
                if (pullCount === 1) {
                    controller.enqueue(new Uint8Array([1, 2, 3]) as Uint8Array<ArrayBuffer>);
                } else {
                    controller.error(new Error('Async pull controller error'));
                }
            },
        });

        const result = await fs.writeFile('/test-error-stream-async-pull-ctrl.bin', errorStream);
        expect(result.isErr()).toBe(true);
        expect(result.unwrapErr().message).toBe('Async pull controller error');
    });
});

describe('peekStream', () => {
    it('should handle stream that errors immediately on first read', async () => {
        const errorStream = new ReadableStream({
            start(controller) {
                controller.error(new Error('Immediate error'));
            },
        });

        const result = await peekStream(errorStream);
        expect(result.isErr()).toBe(true);
        expect(result.unwrapErr().message).toBe('Immediate error');
    });

    it('should handle cancel on peeked stream', async () => {
        const chunks = [new Uint8Array([1, 2, 3]), new Uint8Array([4, 5, 6])];
        let cancelCalled = false;

        const sourceStream = new ReadableStream<Uint8Array>({
            async pull(controller) {
                const chunk = chunks.shift();
                if (chunk) {
                    controller.enqueue(chunk);
                } else {
                    controller.close();
                }
            },
            cancel() {
                cancelCalled = true;
            },
        });

        const result = await peekStream(sourceStream);
        expect(result.isOk()).toBe(true);

        const { isEmpty, stream } = result.unwrap();
        expect(isEmpty).toBe(false);

        // Cancel the peeked stream
        await stream.cancel('test cancel reason');

        // The original stream's cancel should have been called
        expect(cancelCalled).toBe(true);
    });

    it('should detect empty stream', async () => {
        const emptyStream = new ReadableStream({
            start(controller) {
                controller.close();
            },
        });

        const result = await peekStream(emptyStream);
        expect(result.isOk()).toBe(true);

        const { isEmpty, stream } = result.unwrap();
        expect(isEmpty).toBe(true);

        // Reading from the returned stream should yield nothing
        const reader = stream.getReader();
        const { done, value } = await reader.read();
        expect(done).toBe(true);
        expect(value).toBeUndefined();
    });

    it('should reconstruct stream with first chunk prepended', async () => {
        const chunks = [new Uint8Array([1, 2, 3]), new Uint8Array([4, 5, 6])];
        const sourceStream = new ReadableStream<Uint8Array>({
            async pull(controller) {
                const chunk = chunks.shift();
                if (chunk) {
                    controller.enqueue(chunk);
                } else {
                    controller.close();
                }
            },
        });

        const result = await peekStream(sourceStream);
        expect(result.isOk()).toBe(true);

        const { isEmpty, stream } = result.unwrap();
        expect(isEmpty).toBe(false);

        // Read all chunks from reconstructed stream
        const reader = stream.getReader();
        const allChunks: Uint8Array[] = [];

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            allChunks.push(value);
        }

        // Should have 2 chunks (first was prepended, second was read via pull)
        expect(allChunks.length).toBe(2);
        expect(allChunks[0]).toEqual(new Uint8Array([1, 2, 3]));
        expect(allChunks[1]).toEqual(new Uint8Array([4, 5, 6]));
    });

    it('should handle error during pull after peek', async () => {
        let pullCount = 0;
        const sourceStream = new ReadableStream<Uint8Array>({
            pull(controller) {
                pullCount++;
                if (pullCount === 1) {
                    controller.enqueue(new Uint8Array([1, 2, 3]) as Uint8Array<ArrayBuffer>);
                } else {
                    throw new Error('Error during pull');
                }
            },
        });

        const result = await peekStream(sourceStream);
        expect(result.isOk()).toBe(true);

        const { stream } = result.unwrap();
        const reader = stream.getReader();

        // First read should succeed (first chunk was already peeked)
        const first = await reader.read();
        expect(first.done).toBe(false);
        expect(first.value).toEqual(new Uint8Array([1, 2, 3]));

        // Second read should fail
        await expect(reader.read()).rejects.toThrow('Error during pull');
    });
});
