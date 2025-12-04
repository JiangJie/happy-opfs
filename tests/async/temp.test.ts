/**
 * Tests for temporary file operations: mkTemp, pruneTemp, deleteTemp, generateTempPath, isTempPath
 */
import * as fs from '../../src/mod.ts';
import { assert, assertOk, describe, test } from '../test-utils.ts';

export async function testTemp(): Promise<void> {
    await describe('Temp - generateTempPath', async () => {
        await test('should generate temp path with default options', () => {
            const path = fs.generateTempPath();
            assert(path.startsWith('/tmp/tmp-'));
            assert(path.length > '/tmp/tmp-'.length);
        });

        await test('should generate temp path with custom basename', () => {
            const path = fs.generateTempPath({ basename: 'custom' });
            assert(path.startsWith('/tmp/custom-'));
        });

        await test('should generate temp path with extension', () => {
            const path = fs.generateTempPath({ extname: '.txt' });
            assert(path.endsWith('.txt'));
        });

        await test('should generate temp path with basename and extension', () => {
            const path = fs.generateTempPath({ basename: 'test', extname: '.log' });
            assert(path.startsWith('/tmp/test-'));
            assert(path.endsWith('.log'));
        });

        await test('should generate temp directory path (no extension)', () => {
            const path = fs.generateTempPath({ isDirectory: true, extname: '.txt' });
            assert(!path.endsWith('.txt'));
        });

        await test('should generate path without basename prefix when empty', () => {
            const path = fs.generateTempPath({ basename: '' });
            assert(path.startsWith('/tmp/'));
            // Should not have a leading dash after /tmp/
            assert(!path.startsWith('/tmp/-'));
        });
    });

    await describe('Temp - isTempPath', async () => {
        await test('should return true for temp paths', () => {
            assert(fs.isTempPath('/tmp/file.txt'));
            assert(fs.isTempPath('/tmp/subdir/file.txt'));
            assert(fs.isTempPath('/tmp/'));
        });

        await test('should return false for non-temp paths', () => {
            assert(!fs.isTempPath('/data/file.txt'));
            assert(!fs.isTempPath('/'));
            assert(!fs.isTempPath('/tmpfile.txt'));
            assert(!fs.isTempPath('/temp/file.txt'));
        });
    });

    await describe('Temp - mkTemp', async () => {
        await test('should create temporary file', async () => {
            const result = await fs.mkTemp();
            const path = assertOk(result);

            assert(fs.isTempPath(path));
            assert(assertOk(await fs.exists(path)));

            await fs.remove(path);
        });

        await test('should create temporary file with custom basename', async () => {
            const result = await fs.mkTemp({ basename: 'mytemp' });
            const path = assertOk(result);

            assert(path.startsWith('/tmp/mytemp-'));
            assert(assertOk(await fs.exists(path)));

            await fs.remove(path);
        });

        await test('should create temporary file with extension', async () => {
            const result = await fs.mkTemp({ extname: '.json' });
            const path = assertOk(result);

            assert(path.endsWith('.json'));
            assert(assertOk(await fs.exists(path)));

            await fs.remove(path);
        });

        await test('should create temporary directory', async () => {
            const result = await fs.mkTemp({ isDirectory: true });
            const path = assertOk(result);

            assert(fs.isTempPath(path));
            assert(assertOk(await fs.exists(path, { isDirectory: true })));

            await fs.remove(path);
        });
    });

    await describe('Temp - pruneTemp', async () => {
        await test('should remove expired temp files', async () => {
            // Create temp files
            const path1 = assertOk(await fs.mkTemp({ basename: 'prune' }));
            const path2 = assertOk(await fs.mkTemp({ basename: 'prune' }));

            // Wait a bit to ensure different timestamps
            await new Promise(resolve => setTimeout(resolve, 50));
            const expired = new Date();

            // Create more temp files after the cutoff
            const path3 = assertOk(await fs.mkTemp({ basename: 'keep' }));

            // Prune files created before `expired`
            const result = await fs.pruneTemp(expired);
            assertOk(result);

            // Older files should be removed
            assert(!assertOk(await fs.exists(path1)));
            assert(!assertOk(await fs.exists(path2)));

            // Newer file should remain
            assert(assertOk(await fs.exists(path3)));

            await fs.remove(path3);
        });
    });

    await describe('Temp - deleteTemp', async () => {
        await test('should delete entire temp directory', async () => {
            // Create some temp files first
            await fs.mkTemp();
            await fs.mkTemp();

            assert(assertOk(await fs.exists(fs.TMP_DIR)));

            const result = await fs.deleteTemp();
            assertOk(result);

            assert(!assertOk(await fs.exists(fs.TMP_DIR)));
        });

        await test('should succeed even if temp directory does not exist', async () => {
            // Ensure temp dir doesn't exist
            await fs.remove(fs.TMP_DIR);

            const result = await fs.deleteTemp();
            assertOk(result);
        });
    });
}
