/**
 * Tests for utility functions
 */
import * as fs from '../../src/mod.ts';
import { assert, assertEqual, assertOk, describe, test } from '../test-utils.ts';

export async function testUtils(): Promise<void> {
    await describe('Utils - isFileHandle & isDirectoryHandle', async () => {
        await test('isFileHandle should return true for file handle', async () => {
            await fs.writeFile('/handle-file.txt', 'content');

            const result = await fs.stat('/handle-file.txt');
            const handle = assertOk(result);

            assert(fs.isFileHandle(handle));
            assert(!fs.isDirectoryHandle(handle));

            await fs.remove('/handle-file.txt');
        });

        await test('isDirectoryHandle should return true for directory handle', async () => {
            await fs.mkdir('/handle-dir');

            const result = await fs.stat('/handle-dir');
            const handle = assertOk(result);

            assert(fs.isDirectoryHandle(handle));
            assert(!fs.isFileHandle(handle));

            await fs.remove('/handle-dir');
        });
    });

    await describe('Utils - toFileSystemHandleLike', async () => {
        await test('should convert file handle to FileSystemFileHandleLike', async () => {
            await fs.writeFile('/handle-like-file.txt', 'content');

            const statResult = await fs.stat('/handle-like-file.txt');
            const handle = assertOk(statResult);

            const handleLike = await fs.toFileSystemHandleLike(handle);

            assertEqual(handleLike.name, 'handle-like-file.txt');
            assertEqual(handleLike.kind, 'file');

            // Should have file-specific properties
            assert(fs.isFileHandleLike(handleLike));
            if (fs.isFileHandleLike(handleLike)) {
                assertEqual(handleLike.size, 7); // 'content'.length
                assert(handleLike.lastModified > 0);
            }

            await fs.remove('/handle-like-file.txt');
        });

        await test('should convert directory handle to FileSystemHandleLike', async () => {
            await fs.mkdir('/handle-like-dir');

            const statResult = await fs.stat('/handle-like-dir');
            const handle = assertOk(statResult);

            const handleLike = await fs.toFileSystemHandleLike(handle);

            assertEqual(handleLike.name, 'handle-like-dir');
            assertEqual(handleLike.kind, 'directory');
            assert(!fs.isFileHandleLike(handleLike));

            await fs.remove('/handle-like-dir');
        });
    });

    await describe('Utils - isFileHandleLike', async () => {
        await test('should return true for file handle like', async () => {
            await fs.writeFile('/file-handle-like.txt', 'test');

            const statResult = await fs.stat('/file-handle-like.txt');
            const handle = assertOk(statResult);
            const handleLike = await fs.toFileSystemHandleLike(handle);

            assert(fs.isFileHandleLike(handleLike));

            await fs.remove('/file-handle-like.txt');
        });

        await test('should return false for directory handle like', async () => {
            await fs.mkdir('/dir-handle-like');

            const statResult = await fs.stat('/dir-handle-like');
            const handle = assertOk(statResult);
            const handleLike = await fs.toFileSystemHandleLike(handle);

            assert(!fs.isFileHandleLike(handleLike));

            await fs.remove('/dir-handle-like');
        });
    });

    await describe('Utils - isOPFSSupported', async () => {
        await test('should return true in supported environment', () => {
            // In a browser environment with OPFS support
            const supported = fs.isOPFSSupported();
            assert(typeof supported === 'boolean');
            // If we're running tests, OPFS must be supported
            assert(supported);
        });
    });

    await describe('Utils - constants', async () => {
        await test('ROOT_DIR should be /', () => {
            assertEqual(fs.ROOT_DIR, '/');
        });

        await test('TMP_DIR should be /tmp', () => {
            assertEqual(fs.TMP_DIR, '/tmp');
        });
    });
}
