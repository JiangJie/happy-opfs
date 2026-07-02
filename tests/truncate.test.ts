/**
 * truncate / truncateSync tests using Vitest
 */
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import * as fs from '../src/mod.ts';

describe('truncate (async)', () => {
    afterEach(async () => {
        await fs.remove('/trunc-async.txt');
        await fs.remove('/trunc-async-dir');
    });

    it('should truncate file to a smaller size', async () => {
        await fs.writeFile('/trunc-async.txt', 'Hello, World!');
        const result = await fs.truncate('/trunc-async.txt', 5);
        expect(result.isOk()).toBe(true);

        const content = await fs.readTextFile('/trunc-async.txt');
        expect(content.unwrap()).toBe('Hello');
    });

    it('should truncate file to zero bytes', async () => {
        await fs.writeFile('/trunc-async.txt', 'Hello, World!');
        const result = await fs.truncate('/trunc-async.txt', 0);
        expect(result.isOk()).toBe(true);

        const content = await fs.readFile('/trunc-async.txt');
        expect(content.unwrap().byteLength).toBe(0);
    });

    it('should extend file with zero bytes when len exceeds current size', async () => {
        await fs.writeFile('/trunc-async.txt', 'Hello');
        const result = await fs.truncate('/trunc-async.txt', 8);
        expect(result.isOk()).toBe(true);

        const bytes = (await fs.readFile('/trunc-async.txt')).unwrap();
        expect(bytes.byteLength).toBe(8);
        expect(bytes[0]).toBe(0x48); // 'H'
        expect(bytes[4]).toBe(0x6f); // 'o'
        expect(bytes[5]).toBe(0);    // zero-padded
        expect(bytes[7]).toBe(0);    // zero-padded
    });

    it('should fail when file does not exist', async () => {
        const result = await fs.truncate('/nonexistent-trunc-async.txt', 10);
        expect(result.isErr()).toBe(true);
        expect(result.unwrapErr().name).toBe('NotFoundError');
    });

    it('should fail when path is a directory', async () => {
        await fs.mkdir('/trunc-async-dir');
        const result = await fs.truncate('/trunc-async-dir', 10);
        expect(result.isErr()).toBe(true);
        expect(result.unwrapErr().name).toBe('TypeMismatchError');
    });

    it('should fail when len is negative', async () => {
        await fs.writeFile('/trunc-async.txt', 'Hello');
        const result = await fs.truncate('/trunc-async.txt', -1);
        expect(result.isErr()).toBe(true);
        expect(result.unwrapErr().name).toBe('TypeError');
    });

    it('should fail when len is not an integer', async () => {
        await fs.writeFile('/trunc-async.txt', 'Hello');
        const result = await fs.truncate('/trunc-async.txt', 2.5);
        expect(result.isErr()).toBe(true);
        expect(result.unwrapErr().name).toBe('TypeError');
    });

    it('should fail when path is not absolute', async () => {
        const result = await fs.truncate('relative/path', 10);
        expect(result.isErr()).toBe(true);
    });
});

describe('truncateSync', () => {
    beforeAll(async () => {
        await fs.SyncChannel.connect(
            new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' }),
            { sharedBufferLength: 10 * 1024 * 1024, opTimeout: 5000 },
        );
    });

    afterEach(() => {
        fs.removeSync('/trunc-sync.txt');
    });

    afterAll(() => {
        fs.emptyDirSync(fs.ROOT_DIR);
    });

    it('should truncate file synchronously', () => {
        fs.writeFileSync('/trunc-sync.txt', 'Hello, World!');
        const result = fs.truncateSync('/trunc-sync.txt', 5);
        expect(result.isOk()).toBe(true);

        const content = fs.readTextFileSync('/trunc-sync.txt');
        expect(content.unwrap()).toBe('Hello');
    });

    it('should extend file synchronously with zero bytes', () => {
        fs.writeFileSync('/trunc-sync.txt', 'Hello');
        const result = fs.truncateSync('/trunc-sync.txt', 8);
        expect(result.isOk()).toBe(true);

        const bytes = fs.readFileSync('/trunc-sync.txt').unwrap();
        expect(bytes.byteLength).toBe(8);
        expect(bytes[5]).toBe(0);
        expect(bytes[7]).toBe(0);
    });

    it('should truncate file to zero synchronously', () => {
        fs.writeFileSync('/trunc-sync.txt', 'Hello, World!');
        const result = fs.truncateSync('/trunc-sync.txt', 0);
        expect(result.isOk()).toBe(true);

        const content = fs.readFileSync('/trunc-sync.txt');
        expect(content.unwrap().byteLength).toBe(0);
    });

    it('should fail synchronously when file does not exist', () => {
        const result = fs.truncateSync('/nonexistent-trunc-sync.txt', 10);
        expect(result.isErr()).toBe(true);
        expect(result.unwrapErr().name).toBe('NotFoundError');
    });

    it('should fail synchronously when len is negative', () => {
        fs.writeFileSync('/trunc-sync.txt', 'Hello');
        const result = fs.truncateSync('/trunc-sync.txt', -1);
        expect(result.isErr()).toBe(true);
        expect(result.unwrapErr().name).toBe('TypeError');
    });

    it('should fail synchronously when len is not an integer', () => {
        fs.writeFileSync('/trunc-sync.txt', 'Hello');
        const result = fs.truncateSync('/trunc-sync.txt', 2.5);
        expect(result.isErr()).toBe(true);
        expect(result.unwrapErr().name).toBe('TypeError');
    });

    it('should fail synchronously when path is not absolute', () => {
        const result = fs.truncateSync('relative/path', 10);
        expect(result.isErr()).toBe(true);
    });
});
