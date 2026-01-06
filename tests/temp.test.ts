/**
 * Temporary file operations tests using Vitest
 * Tests: generateTempPath, isTempPath, mkTemp, pruneTemp, deleteTemp
 */
import { afterAll, afterEach, describe, expect, it } from 'vitest';
import * as fs from '../src/mod.ts';

describe('OPFS Temporary File Operations', () => {
    // Clean up temp directory after all tests
    afterAll(async () => {
        await fs.deleteTemp();
    });

    describe('generateTempPath', () => {
        it('should generate temp path with default options', () => {
            const path = fs.generateTempPath();
            expect(path.startsWith('/tmp/tmp-')).toBe(true);
            expect(path.length).toBeGreaterThan('/tmp/tmp-'.length);
        });

        it('should generate temp path with custom basename', () => {
            const path = fs.generateTempPath({ basename: 'custom' });
            expect(path.startsWith('/tmp/custom-')).toBe(true);
        });

        it('should generate temp path with extension', () => {
            const path = fs.generateTempPath({ extname: '.txt' });
            expect(path.endsWith('.txt')).toBe(true);
        });

        it('should generate temp path with basename and extension', () => {
            const path = fs.generateTempPath({ basename: 'test', extname: '.log' });
            expect(path.startsWith('/tmp/test-')).toBe(true);
            expect(path.endsWith('.log')).toBe(true);
        });

        it('should generate temp directory path (no extension)', () => {
            const path = fs.generateTempPath({ isDirectory: true, extname: '.txt' });
            expect(path.endsWith('.txt')).toBe(false);
        });

        it('should generate path without basename prefix when empty', () => {
            const path = fs.generateTempPath({ basename: '' });
            expect(path.startsWith('/tmp/')).toBe(true);
            // Should not have a leading dash after /tmp/
            expect(path.startsWith('/tmp/-')).toBe(false);
        });
    });

    describe('isTempPath', () => {
        it('should return true for temp paths', () => {
            expect(fs.isTempPath('/tmp/file.txt')).toBe(true);
            expect(fs.isTempPath('/tmp/subdir/file.txt')).toBe(true);
            expect(fs.isTempPath('/tmp/')).toBe(true);
        });

        it('should return false for non-temp paths', () => {
            expect(fs.isTempPath('/data/file.txt')).toBe(false);
            expect(fs.isTempPath('/')).toBe(false);
            expect(fs.isTempPath('/tmpfile.txt')).toBe(false);
            expect(fs.isTempPath('/temp/file.txt')).toBe(false);
        });
    });

    describe('mkTemp', () => {
        afterEach(async () => {
            // Clean up created temp files
            await fs.deleteTemp();
        });

        it('should create temporary file', async () => {
            const result = await fs.mkTemp();
            const path = result.unwrap();

            expect(fs.isTempPath(path)).toBe(true);
            expect((await fs.exists(path)).unwrap()).toBe(true);
        });

        it('should create temporary file with custom basename', async () => {
            const result = await fs.mkTemp({ basename: 'mytemp' });
            const path = result.unwrap();

            expect(path.startsWith('/tmp/mytemp-')).toBe(true);
            expect((await fs.exists(path)).unwrap()).toBe(true);
        });

        it('should create temporary file with extension', async () => {
            const result = await fs.mkTemp({ extname: '.json' });
            const path = result.unwrap();

            expect(path.endsWith('.json')).toBe(true);
            expect((await fs.exists(path)).unwrap()).toBe(true);
        });

        it('should create temporary directory', async () => {
            const result = await fs.mkTemp({ isDirectory: true });
            const path = result.unwrap();

            expect(fs.isTempPath(path)).toBe(true);
            expect((await fs.exists(path, { isDirectory: true })).unwrap()).toBe(true);
        });
    });

    describe('pruneTemp', () => {
        it('should remove expired temp files', async () => {
            // Create temp files
            const path1 = (await fs.mkTemp({ basename: 'prune' })).unwrap();
            const path2 = (await fs.mkTemp({ basename: 'prune' })).unwrap();

            // Wait a bit to ensure different timestamps
            await new Promise(resolve => setTimeout(resolve, 100));
            const expired = new Date();
            await new Promise(resolve => setTimeout(resolve, 1));

            // Create more temp files after the cutoff
            const path3 = (await fs.mkTemp({ basename: 'keep' })).unwrap();

            // Prune files created before `expired`
            const result = await fs.pruneTemp(expired);
            expect(result.isOk()).toBe(true);

            // Older files should be removed
            expect((await fs.exists(path1)).unwrap()).toBe(false);
            expect((await fs.exists(path2)).unwrap()).toBe(false);

            // Newer file should remain
            expect((await fs.exists(path3)).unwrap()).toBe(true);

            await fs.remove(path3);
        });

        it('should skip directories when pruning', async () => {
            // Create temp files
            const filePath = (await fs.mkTemp({ basename: 'prune-file' })).unwrap();
            // Create temp directory - this should be skipped by pruneTemp
            const dirPath = (await fs.mkTemp({ basename: 'prune-dir', isDirectory: true })).unwrap();
            // Create a file inside the temp directory
            await fs.writeFile(`${dirPath}/nested.txt`, 'nested content');

            // Wait a bit then prune everything before now
            await new Promise(resolve => setTimeout(resolve, 100));
            const expired = new Date();
            await new Promise(resolve => setTimeout(resolve, 1));

            const result = await fs.pruneTemp(expired);
            expect(result.isOk()).toBe(true);

            // File should be removed
            expect((await fs.exists(filePath)).unwrap()).toBe(false);
            // Directory itself should still exist (pruneTemp only removes direct children files)
            expect((await fs.exists(dirPath)).unwrap()).toBe(true);
            // Nested file inside directory should also still exist (pruneTemp doesn't recurse)
            expect((await fs.exists(`${dirPath}/nested.txt`)).unwrap()).toBe(true);

            await fs.remove(dirPath);
        });
    });

    describe('deleteTemp', () => {
        it('should delete entire temp directory', async () => {
            // Create some temp files first
            await fs.mkTemp();
            await fs.mkTemp();

            expect((await fs.exists(fs.TMP_DIR)).unwrap()).toBe(true);

            const result = await fs.deleteTemp();
            expect(result.isOk()).toBe(true);

            expect((await fs.exists(fs.TMP_DIR)).unwrap()).toBe(false);
        });

        it('should succeed even if temp directory does not exist', async () => {
            // Ensure temp dir doesn't exist
            await fs.remove(fs.TMP_DIR);

            const result = await fs.deleteTemp();
            expect(result.isOk()).toBe(true);
        });
    });
});
