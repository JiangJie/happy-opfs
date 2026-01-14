import { describe, it, expect } from 'vitest';
import * as fs from '../src/mod.ts';

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
