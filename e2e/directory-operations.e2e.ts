/**
 * E2E tests for directory operations using native OPFS API
 */
import { test, expect } from '@playwright/test';

test.describe('OPFS Directory Operations E2E', () => {
    // Clean up before each test
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await page.evaluate(async () => {
            const root = await navigator.storage.getDirectory();
            // Try to clean up test directories
            try { await root.removeEntry('e2e-dir', { recursive: true }); } catch {}
            try { await root.removeEntry('e2e-nested', { recursive: true }); } catch {}
        });
    });

    test('should create directory', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const root = await navigator.storage.getDirectory();
            
            // Create directory
            const dirHandle = await root.getDirectoryHandle('e2e-dir', { create: true });
            
            // Verify it exists
            const exists = dirHandle.kind === 'directory';
            const name = dirHandle.name;
            
            // Clean up
            await root.removeEntry('e2e-dir');
            
            return { exists, name };
        });
        
        expect(result.exists).toBe(true);
        expect(result.name).toBe('e2e-dir');
    });

    test('should create nested directories', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const root = await navigator.storage.getDirectory();
            
            // Create nested directories
            const dir1 = await root.getDirectoryHandle('e2e-nested', { create: true });
            const dir2 = await dir1.getDirectoryHandle('level1', { create: true });
            const dir3 = await dir2.getDirectoryHandle('level2', { create: true });
            
            // Create file in deepest directory
            const fileHandle = await dir3.getFileHandle('deep-file.txt', { create: true });
            const writable = await fileHandle.createWritable();
            await writable.write('Deep content');
            await writable.close();
            
            // Read file back
            const file = await fileHandle.getFile();
            const content = await file.text();
            
            // Clean up
            await root.removeEntry('e2e-nested', { recursive: true });
            
            return { content, depth: 3 };
        });
        
        expect(result.content).toBe('Deep content');
        expect(result.depth).toBe(3);
    });

    test('should list directory entries', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const root = await navigator.storage.getDirectory();
            
            // Create directory with files
            const dir = await root.getDirectoryHandle('e2e-dir', { create: true });
            
            // Create some files
            const file1 = await dir.getFileHandle('file1.txt', { create: true });
            let writable = await file1.createWritable();
            await writable.write('content1');
            await writable.close();
            
            const file2 = await dir.getFileHandle('file2.txt', { create: true });
            writable = await file2.createWritable();
            await writable.write('content2');
            await writable.close();
            
            // Create subdirectory
            await dir.getDirectoryHandle('subdir', { create: true });
            
            // List entries
            const entries: { name: string; kind: string }[] = [];
            for await (const [name, handle] of dir.entries()) {
                entries.push({ name, kind: handle.kind });
            }
            
            // Clean up
            await root.removeEntry('e2e-dir', { recursive: true });
            
            return {
                count: entries.length,
                entries: entries.sort((a, b) => a.name.localeCompare(b.name))
            };
        });
        
        expect(result.count).toBe(3);
        expect(result.entries[0]).toEqual({ name: 'file1.txt', kind: 'file' });
        expect(result.entries[1]).toEqual({ name: 'file2.txt', kind: 'file' });
        expect(result.entries[2]).toEqual({ name: 'subdir', kind: 'directory' });
    });

    test('should remove directory recursively', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const root = await navigator.storage.getDirectory();
            
            // Create directory with nested content
            const dir = await root.getDirectoryHandle('e2e-dir', { create: true });
            const subdir = await dir.getDirectoryHandle('subdir', { create: true });
            
            const file1 = await dir.getFileHandle('file.txt', { create: true });
            let writable = await file1.createWritable();
            await writable.write('content');
            await writable.close();
            
            const file2 = await subdir.getFileHandle('nested-file.txt', { create: true });
            writable = await file2.createWritable();
            await writable.write('nested');
            await writable.close();
            
            // Remove directory recursively
            await root.removeEntry('e2e-dir', { recursive: true });
            
            // Verify it's gone
            try {
                await root.getDirectoryHandle('e2e-dir');
                return { removed: false };
            } catch {
                return { removed: true };
            }
        });
        
        expect(result.removed).toBe(true);
    });

    test('should fail to remove non-empty directory without recursive option', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const root = await navigator.storage.getDirectory();
            
            // Create directory with file
            const dir = await root.getDirectoryHandle('e2e-dir', { create: true });
            const file = await dir.getFileHandle('file.txt', { create: true });
            const writable = await file.createWritable();
            await writable.write('content');
            await writable.close();
            
            // Try to remove without recursive
            try {
                await root.removeEntry('e2e-dir');
                // Clean up if it somehow succeeded
                return { error: false };
            } catch (e) {
                // Clean up
                await root.removeEntry('e2e-dir', { recursive: true });
                return { error: true, name: (e as Error).name };
            }
        });
        
        expect(result.error).toBe(true);
        expect(result.name).toBe('InvalidModificationError');
    });

    test('should handle empty directory', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const root = await navigator.storage.getDirectory();
            
            // Create empty directory
            const dir = await root.getDirectoryHandle('e2e-dir', { create: true });
            
            // List entries
            const entries: string[] = [];
            for await (const [name] of dir.entries()) {
                entries.push(name);
            }
            
            // Clean up
            await root.removeEntry('e2e-dir');
            
            return { count: entries.length };
        });
        
        expect(result.count).toBe(0);
    });
});
