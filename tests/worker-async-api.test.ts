/**
 * Tests for async API calls directly in Worker context.
 * This verifies that readViaSyncAccess works correctly for all encoding types.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import * as fs from '../src/mod.ts';

describe('Worker Async API (readViaSyncAccess)', () => {
    let worker: Worker;

    function callWorker(request: { type: string; filePath: string; encoding?: string; }): Promise<{
        success: boolean;
        resultType?: string;
        value?: unknown;
        error?: string;
    }> {
        return new Promise((resolve) => {
            const handler = (event: MessageEvent): void => {
                // Ignore 'ready' messages
                if (event.data.type === 'ready') {
                    return;
                }
                worker.removeEventListener('message', handler);
                resolve(event.data);
            };
            worker.addEventListener('message', handler);
            worker.postMessage(request);
        });
    }

    beforeAll(async () => {
        // Create test file first
        await fs.writeFile('/worker-async-test.txt', 'Hello from Worker async API test');

        worker = new Worker(new URL('./worker-async-api.ts', import.meta.url), {
            type: 'module',
        });

        // Wait for worker to be ready
        await new Promise<void>((resolve) => {
            const handler = (event: MessageEvent): void => {
                if (event.data.type === 'ready') {
                    worker.removeEventListener('message', handler);
                    resolve();
                }
            };
            worker.addEventListener('message', handler);
        });
    });

    afterAll(async () => {
        worker.terminate();
        await fs.remove('/worker-async-test.txt');
    });

    describe('readFile with different encodings via readViaSyncAccess', () => {
        it('should return Uint8Array for bytes encoding', async () => {
            const response = await callWorker({
                type: 'readFile',
                filePath: '/worker-async-test.txt',
                encoding: 'bytes',
            });

            expect(response.success).toBe(true);
            expect(response.resultType).toBe('Uint8Array');
            expect(Array.isArray(response.value)).toBe(true);
            // Verify content
            const bytes = new Uint8Array(response.value as number[]);
            const text = new TextDecoder().decode(bytes);
            expect(text).toBe('Hello from Worker async API test');
        });

        it('should return string for utf8 encoding', async () => {
            const response = await callWorker({
                type: 'readFile',
                filePath: '/worker-async-test.txt',
                encoding: 'utf8',
            });

            expect(response.success).toBe(true);
            expect(response.resultType).toBe('string');
            expect(response.value).toBe('Hello from Worker async API test');
        });

        it('should return ArrayBuffer for binary encoding', async () => {
            const response = await callWorker({
                type: 'readFile',
                filePath: '/worker-async-test.txt',
                encoding: 'binary',
            });

            expect(response.success).toBe(true);
            expect(response.resultType).toBe('ArrayBuffer');
            // value is byteLength
            expect(response.value).toBe('Hello from Worker async API test'.length);
        });

        it('should return ArrayBuffer for undefined encoding (default)', async () => {
            const response = await callWorker({
                type: 'readFile',
                filePath: '/worker-async-test.txt',
            });

            expect(response.success).toBe(true);
            expect(response.resultType).toBe('ArrayBuffer');
            expect(response.value).toBe('Hello from Worker async API test'.length);
        });
    });
});
