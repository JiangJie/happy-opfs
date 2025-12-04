/**
 * Tests for sync temporary file operations
 */
import * as fs from '../../src/mod.ts';
import { assert, assertOk, describe, test } from '../test-utils.ts';

export async function testSyncTemp(): Promise<void> {
    await describe('Sync Temp - mkTempSync', async () => {
        await test('should create temporary file', () => {
            const result = fs.mkTempSync();
            const path = assertOk(result);

            assert(fs.isTempPath(path));
            assert(assertOk(fs.existsSync(path)));

            fs.removeSync(path);
        });

        await test('should create temporary file with custom basename', () => {
            const result = fs.mkTempSync({ basename: 'synctemp' });
            const path = assertOk(result);

            assert(path.startsWith('/tmp/synctemp-'));
            assert(assertOk(fs.existsSync(path)));

            fs.removeSync(path);
        });

        await test('should create temporary file with extension', () => {
            const result = fs.mkTempSync({ extname: '.log' });
            const path = assertOk(result);

            assert(path.endsWith('.log'));
            assert(assertOk(fs.existsSync(path)));

            fs.removeSync(path);
        });

        await test('should create temporary directory', () => {
            const result = fs.mkTempSync({ isDirectory: true });
            const path = assertOk(result);

            assert(fs.isTempPath(path));
            assert(assertOk(fs.existsSync(path, { isDirectory: true })));

            fs.removeSync(path);
        });
    });

    await describe('Sync Temp - pruneTempSync', async () => {
        await test('should remove expired temp files', async () => {
            // Create temp files
            const path1 = assertOk(fs.mkTempSync({ basename: 'sync-prune' }));
            const path2 = assertOk(fs.mkTempSync({ basename: 'sync-prune' }));

            // Wait a bit
            await new Promise(resolve => setTimeout(resolve, 50));
            const expired = new Date();

            // Create more temp files after the cutoff
            const path3 = assertOk(fs.mkTempSync({ basename: 'sync-keep' }));

            // Prune
            const result = fs.pruneTempSync(expired);
            assertOk(result);

            // Older files should be removed
            assert(!assertOk(fs.existsSync(path1)));
            assert(!assertOk(fs.existsSync(path2)));

            // Newer file should remain
            assert(assertOk(fs.existsSync(path3)));

            fs.removeSync(path3);
        });
    });

    await describe('Sync Temp - deleteTempSync', async () => {
        await test('should delete entire temp directory', () => {
            // Create some temp files first
            fs.mkTempSync();
            fs.mkTempSync();

            assert(assertOk(fs.existsSync(fs.TMP_DIR)));

            const result = fs.deleteTempSync();
            assertOk(result);

            assert(!assertOk(fs.existsSync(fs.TMP_DIR)));
        });

        await test('should succeed even if temp directory does not exist', () => {
            fs.removeSync(fs.TMP_DIR);

            const result = fs.deleteTempSync();
            assertOk(result);
        });
    });
}
