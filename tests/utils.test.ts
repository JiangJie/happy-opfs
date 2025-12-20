/**
 * Utility functions tests using Vitest
 * Tests: isFileHandle, isDirectoryHandle, toFileSystemHandleLike, isFileHandleLike, isOPFSSupported, constants
 */
import { afterEach, describe, expect, it } from 'vitest';
import * as fs from '../src/mod.ts';

describe('OPFS Utils', () => {
    afterEach(async () => {
        await fs.remove('/handle-file.txt');
        await fs.remove('/handle-dir');
        await fs.remove('/handle-like-file.txt');
        await fs.remove('/handle-like-dir');
        await fs.remove('/file-handle-like.txt');
        await fs.remove('/dir-handle-like');
    });

    describe('isFileHandle & isDirectoryHandle', () => {
        it('should return true for file handle', async () => {
            await fs.writeFile('/handle-file.txt', 'content');

            const result = await fs.stat('/handle-file.txt');
            const handle = result.unwrap();

            expect(fs.isFileHandle(handle)).toBe(true);
            expect(fs.isDirectoryHandle(handle)).toBe(false);
        });

        it('should return true for directory handle', async () => {
            await fs.mkdir('/handle-dir');

            const result = await fs.stat('/handle-dir');
            const handle = result.unwrap();

            expect(fs.isDirectoryHandle(handle)).toBe(true);
            expect(fs.isFileHandle(handle)).toBe(false);
        });
    });

    describe('toFileSystemHandleLike', () => {
        it('should convert file handle to FileSystemFileHandleLike', async () => {
            await fs.writeFile('/handle-like-file.txt', 'content');

            const statResult = await fs.stat('/handle-like-file.txt');
            const handle = statResult.unwrap();

            const handleLike = await fs.toFileSystemHandleLike(handle);

            expect(handleLike.name).toBe('handle-like-file.txt');
            expect(handleLike.kind).toBe('file');

            // Should have file-specific properties
            expect(fs.isFileHandleLike(handleLike)).toBe(true);
            if (fs.isFileHandleLike(handleLike)) {
                expect(handleLike.size).toBe(7); // 'content'.length
                expect(handleLike.lastModified).toBeGreaterThan(0);
            }
        });

        it('should convert directory handle to FileSystemHandleLike', async () => {
            await fs.mkdir('/handle-like-dir');

            const statResult = await fs.stat('/handle-like-dir');
            const handle = statResult.unwrap();

            const handleLike = await fs.toFileSystemHandleLike(handle);

            expect(handleLike.name).toBe('handle-like-dir');
            expect(handleLike.kind).toBe('directory');
            expect(fs.isFileHandleLike(handleLike)).toBe(false);
        });
    });

    describe('isFileHandleLike', () => {
        it('should return true for file handle like', async () => {
            await fs.writeFile('/file-handle-like.txt', 'test');

            const statResult = await fs.stat('/file-handle-like.txt');
            const handle = statResult.unwrap();
            const handleLike = await fs.toFileSystemHandleLike(handle);

            expect(fs.isFileHandleLike(handleLike)).toBe(true);
        });

        it('should return false for directory handle like', async () => {
            await fs.mkdir('/dir-handle-like');

            const statResult = await fs.stat('/dir-handle-like');
            const handle = statResult.unwrap();
            const handleLike = await fs.toFileSystemHandleLike(handle);

            expect(fs.isFileHandleLike(handleLike)).toBe(false);
        });
    });
});
