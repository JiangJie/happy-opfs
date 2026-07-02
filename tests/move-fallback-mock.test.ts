/**
 * Mock tests for moveFileHandle fallback when native handle.move() is unavailable.
 * Simulates Firefox/Safari by deleting FileSystemFileHandle.prototype.move.
 *
 * Covers two call sites of moveFileHandle:
 * 1. move() in ext.ts — file and directory move
 * 2. writeStreamToFile() in write.ts — temp-file-then-move for stream writes
 */
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import * as fs from '../src/mod.ts';

describe('moveFileHandle fallback (no native handle.move)', () => {
    // Save original move (undefined in browsers that don't support it)
    const originalMove = (FileSystemFileHandle.prototype as { move?: unknown; }).move;

    beforeAll(() => {
        // Simulate browsers without native handle.move (Firefox/Safari)
        // @ts-expect-error - removing move method for fallback test
        delete FileSystemFileHandle.prototype.move;
    });

    afterAll(() => {
        if (typeof originalMove === 'function') {
            // @ts-expect-error - restoring move method
            FileSystemFileHandle.prototype.move = originalMove;
        }
    });

    afterEach(async () => {
        await fs.remove('/move-fallback-src.txt');
        await fs.remove('/move-fallback-dest.txt');
        await fs.remove('/move-fallback-stream.txt');
        await fs.remove('/move-fallback-dir');
    });

    it('should move file via copy fallback', async () => {
        await fs.writeFile('/move-fallback-src.txt', 'Hello Fallback');
        const res = await fs.move('/move-fallback-src.txt', '/move-fallback-dest.txt');
        expect(res.isOk()).toBe(true);

        const content = await fs.readTextFile('/move-fallback-dest.txt');
        expect(content.unwrap()).toBe('Hello Fallback');

        // Source should be removed (move semantics)
        const srcExists = await fs.exists('/move-fallback-src.txt');
        expect(srcExists.unwrap()).toBe(false);
    });

    it('should write stream via fallback when move unavailable', async () => {
        // writeStreamToFile uses moveFileHandle to move temp file to target
        const stream = new ReadableStream<Uint8Array<ArrayBuffer>>({
            start(controller) {
                controller.enqueue(new TextEncoder().encode('Stream Fallback'));
                controller.close();
            },
        });
        const res = await fs.writeFile('/move-fallback-stream.txt', stream);
        expect(res.isOk()).toBe(true);

        const content = await fs.readTextFile('/move-fallback-stream.txt');
        expect(content.unwrap()).toBe('Stream Fallback');
    });

    it('should move directory via copy fallback', async () => {
        await fs.mkdir('/move-fallback-dir/src/sub');
        await fs.writeFile('/move-fallback-dir/src/file1.txt', 'file1');
        await fs.writeFile('/move-fallback-dir/src/sub/file2.txt', 'file2');

        const res = await fs.move('/move-fallback-dir/src', '/move-fallback-dir/dest');
        expect(res.isOk()).toBe(true);

        const f1 = await fs.readTextFile('/move-fallback-dir/dest/file1.txt');
        expect(f1.unwrap()).toBe('file1');
        const f2 = await fs.readTextFile('/move-fallback-dir/dest/sub/file2.txt');
        expect(f2.unwrap()).toBe('file2');

        // Source directory should be removed
        const srcExists = await fs.exists('/move-fallback-dir/src');
        expect(srcExists.unwrap()).toBe(false);
    });
});
