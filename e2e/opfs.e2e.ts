/**
 * E2E tests for OPFS functionality using Playwright
 * These tests verify browser environment requirements for OPFS
 */
import { test, expect } from '@playwright/test';

test.describe('OPFS E2E Tests', () => {
    test('should have SharedArrayBuffer available', async ({ page }) => {
        await page.goto('/');
        
        const hasSharedArrayBuffer = await page.evaluate(() => {
            return typeof SharedArrayBuffer !== 'undefined';
        });
        
        expect(hasSharedArrayBuffer).toBe(true);
    });

    test('should have OPFS available', async ({ page }) => {
        await page.goto('/');
        
        const hasOPFS = await page.evaluate(async () => {
            try {
                await navigator.storage.getDirectory();
                return true;
            } catch {
                return false;
            }
        });
        
        expect(hasOPFS).toBe(true);
    });

    test('should be able to create and read files in OPFS', async ({ page }) => {
        await page.goto('/');
        
        const result = await page.evaluate(async () => {
            try {
                // Get OPFS root
                const root = await navigator.storage.getDirectory();
                
                // Create a test file
                const fileHandle = await root.getFileHandle('e2e-test.txt', { create: true });
                
                // Write content
                const writable = await fileHandle.createWritable();
                await writable.write('Hello from E2E test!');
                await writable.close();
                
                // Read content back
                const file = await fileHandle.getFile();
                const content = await file.text();
                
                // Clean up
                await root.removeEntry('e2e-test.txt');
                
                return { success: true, content };
            } catch (error) {
                return { success: false, error: String(error) };
            }
        });
        
        expect(result.success).toBe(true);
        expect(result.content).toBe('Hello from E2E test!');
    });

    test('should load test page and verify OPFS support message', async ({ page }) => {
        const consoleLogs: string[] = [];

        page.on('console', (msg) => {
            consoleLogs.push(msg.text());
        });

        // Navigate to the test page
        await page.goto('/');

        // Wait for the page to load and OPFS check to complete
        await page.waitForTimeout(2000);

        // Check that OPFS is supported (the test page logs this)
        const opfsSupported = consoleLogs.some(log => 
            log.includes('OPFS is supported') || 
            log.includes('✓ OPFS is supported') ||
            log.includes('Happy OPFS')
        );
        
        expect(opfsSupported).toBe(true);
    });
});
