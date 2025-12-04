/**
 * E2E tests for file operations using native OPFS API
 */
import { test, expect } from '@playwright/test';

test.describe('OPFS File Operations E2E', () => {
    // Clean up before each test
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await page.evaluate(async () => {
            const root = await navigator.storage.getDirectory();
            // Try to clean up test files
            try { await root.removeEntry('e2e-file.txt'); } catch {}
            try { await root.removeEntry('e2e-binary.bin'); } catch {}
            try { await root.removeEntry('e2e-large.txt'); } catch {}
            try { await root.removeEntry('e2e-unicode.txt'); } catch {}
        });
    });

    test('should write and read text file', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const root = await navigator.storage.getDirectory();
            const content = 'Hello, OPFS E2E Test!';
            
            // Write file
            const fileHandle = await root.getFileHandle('e2e-file.txt', { create: true });
            const writable = await fileHandle.createWritable();
            await writable.write(content);
            await writable.close();
            
            // Read file
            const file = await fileHandle.getFile();
            const readContent = await file.text();
            
            // Clean up
            await root.removeEntry('e2e-file.txt');
            
            return { content: readContent, size: file.size };
        });
        
        expect(result.content).toBe('Hello, OPFS E2E Test!');
        expect(result.size).toBe(21);
    });

    test('should write and read binary file', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const root = await navigator.storage.getDirectory();
            
            // Create binary data
            const data = new Uint8Array([0, 1, 2, 255, 254, 253]);
            
            // Write file
            const fileHandle = await root.getFileHandle('e2e-binary.bin', { create: true });
            const writable = await fileHandle.createWritable();
            await writable.write(data);
            await writable.close();
            
            // Read file
            const file = await fileHandle.getFile();
            const buffer = await file.arrayBuffer();
            const readData = new Uint8Array(buffer);
            
            // Clean up
            await root.removeEntry('e2e-binary.bin');
            
            return {
                size: readData.length,
                first: readData[0],
                last: readData[5],
                match: readData[0] === 0 && readData[3] === 255
            };
        });
        
        expect(result.size).toBe(6);
        expect(result.first).toBe(0);
        expect(result.last).toBe(253);
        expect(result.match).toBe(true);
    });

    test('should handle large file', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const root = await navigator.storage.getDirectory();
            
            // Create large content (100KB)
            const content = 'x'.repeat(100 * 1024);
            
            // Write file
            const fileHandle = await root.getFileHandle('e2e-large.txt', { create: true });
            const writable = await fileHandle.createWritable();
            await writable.write(content);
            await writable.close();
            
            // Read file
            const file = await fileHandle.getFile();
            const readContent = await file.text();
            
            // Clean up
            await root.removeEntry('e2e-large.txt');
            
            return {
                size: file.size,
                contentLength: readContent.length,
                match: content === readContent
            };
        });
        
        expect(result.size).toBe(100 * 1024);
        expect(result.contentLength).toBe(100 * 1024);
        expect(result.match).toBe(true);
    });

    test('should handle unicode content', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const root = await navigator.storage.getDirectory();
            const content = '你好世界 🌍 مرحبا العالم 🎉';
            
            // Write file
            const fileHandle = await root.getFileHandle('e2e-unicode.txt', { create: true });
            const writable = await fileHandle.createWritable();
            await writable.write(content);
            await writable.close();
            
            // Read file
            const file = await fileHandle.getFile();
            const readContent = await file.text();
            
            // Clean up
            await root.removeEntry('e2e-unicode.txt');
            
            return { content: readContent, match: content === readContent };
        });
        
        expect(result.content).toBe('你好世界 🌍 مرحبا العالم 🎉');
        expect(result.match).toBe(true);
    });

    test('should overwrite existing file', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const root = await navigator.storage.getDirectory();
            
            // Create initial file
            const fileHandle = await root.getFileHandle('e2e-file.txt', { create: true });
            let writable = await fileHandle.createWritable();
            await writable.write('Initial content');
            await writable.close();
            
            // Overwrite file
            writable = await fileHandle.createWritable();
            await writable.write('New content');
            await writable.close();
            
            // Read file
            const file = await fileHandle.getFile();
            const content = await file.text();
            
            // Clean up
            await root.removeEntry('e2e-file.txt');
            
            return { content };
        });
        
        expect(result.content).toBe('New content');
    });

    test('should fail to get non-existent file without create option', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const root = await navigator.storage.getDirectory();
            
            try {
                await root.getFileHandle('non-existent-file.txt');
                return { error: false };
            } catch (e) {
                return { error: true, name: (e as Error).name };
            }
        });
        
        expect(result.error).toBe(true);
        expect(result.name).toBe('NotFoundError');
    });
});
