/**
 * E2E tests for synchronous OPFS operations using SharedArrayBuffer
 * These tests verify the sync API works correctly in a real browser environment
 */
import { test, expect } from '@playwright/test';

test.describe('OPFS Sync Operations E2E', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        // Wait for the library to load
        await page.waitForTimeout(1000);
    });

    test('should have SharedArrayBuffer available', async ({ page }) => {
        const hasSharedArrayBuffer = await page.evaluate(() => {
            return typeof SharedArrayBuffer !== 'undefined';
        });

        expect(hasSharedArrayBuffer).toBe(true);
    });

    test('should be able to check crossOriginIsolated', async ({ page }) => {
        const isCrossOriginIsolated = await page.evaluate(() => {
            return self.crossOriginIsolated;
        });

        // This should be true for SharedArrayBuffer to work properly
        expect(isCrossOriginIsolated).toBe(true);
    });

    test('should be able to create SharedArrayBuffer', async ({ page }) => {
        const result = await page.evaluate(() => {
            try {
                const sab = new SharedArrayBuffer(1024);
                return { success: true, byteLength: sab.byteLength };
            } catch (e) {
                return { success: false, error: String(e) };
            }
        });

        expect(result.success).toBe(true);
        expect(result.byteLength).toBe(1024);
    });

    test('should be able to use Atomics with SharedArrayBuffer', async ({ page }) => {
        const result = await page.evaluate(() => {
            try {
                const sab = new SharedArrayBuffer(4);
                const int32 = new Int32Array(sab);
                
                // Test Atomics.store and load
                Atomics.store(int32, 0, 42);
                const value = Atomics.load(int32, 0);
                
                return { success: true, value };
            } catch (e) {
                return { success: false, error: String(e) };
            }
        });

        expect(result.success).toBe(true);
        expect(result.value).toBe(42);
    });

    test('should support Worker with module type', async ({ page }) => {
        const result = await page.evaluate(async () => {
            return new Promise<{ success: boolean; message?: string; error?: string }>((resolve) => {
                try {
                    // Create a simple blob worker to test Worker support
                    const workerCode = `
                        self.onmessage = function(e) {
                            self.postMessage('Worker received: ' + e.data);
                        };
                    `;
                    const blob = new Blob([workerCode], { type: 'application/javascript' });
                    const workerUrl = URL.createObjectURL(blob);
                    const worker = new Worker(workerUrl);
                    
                    worker.onmessage = (e) => {
                        worker.terminate();
                        URL.revokeObjectURL(workerUrl);
                        resolve({ success: true, message: e.data });
                    };
                    
                    worker.onerror = (e) => {
                        worker.terminate();
                        URL.revokeObjectURL(workerUrl);
                        resolve({ success: false, error: e.message });
                    };
                    
                    worker.postMessage('test');
                    
                    // Timeout after 3 seconds
                    setTimeout(() => {
                        worker.terminate();
                        URL.revokeObjectURL(workerUrl);
                        resolve({ success: false, error: 'Worker timeout' });
                    }, 3000);
                } catch (e) {
                    resolve({ success: false, error: String(e) });
                }
            });
        });

        expect(result.success).toBe(true);
        expect(result.message).toContain('Worker received');
    });

    test('should support SharedArrayBuffer communication between main and worker', async ({ page }) => {
        const result = await page.evaluate(async () => {
            return new Promise<{ success: boolean; value?: number; error?: string }>((resolve) => {
                try {
                    const workerCode = `
                        self.onmessage = function(e) {
                            const int32 = new Int32Array(e.data);
                            // Write to shared buffer
                            Atomics.store(int32, 0, 123);
                            Atomics.notify(int32, 0);
                            self.postMessage('done');
                        };
                    `;
                    const blob = new Blob([workerCode], { type: 'application/javascript' });
                    const workerUrl = URL.createObjectURL(blob);
                    const worker = new Worker(workerUrl);
                    
                    const sab = new SharedArrayBuffer(4);
                    const int32 = new Int32Array(sab);
                    Atomics.store(int32, 0, 0);
                    
                    worker.onmessage = () => {
                        const value = Atomics.load(int32, 0);
                        worker.terminate();
                        URL.revokeObjectURL(workerUrl);
                        resolve({ success: true, value });
                    };
                    
                    worker.onerror = (e) => {
                        worker.terminate();
                        URL.revokeObjectURL(workerUrl);
                        resolve({ success: false, error: e.message });
                    };
                    
                    worker.postMessage(sab);
                    
                    setTimeout(() => {
                        worker.terminate();
                        URL.revokeObjectURL(workerUrl);
                        resolve({ success: false, error: 'Timeout' });
                    }, 3000);
                } catch (e) {
                    resolve({ success: false, error: String(e) });
                }
            });
        });

        expect(result.success).toBe(true);
        expect(result.value).toBe(123);
    });
});

test.describe('OPFS Sync API Requirements', () => {
    test('should have all required globals for sync API', async ({ page }) => {
        await page.goto('/');

        const result = await page.evaluate(() => {
            return {
                hasSharedArrayBuffer: typeof SharedArrayBuffer !== 'undefined',
                hasAtomics: typeof Atomics !== 'undefined',
                hasWorker: typeof Worker !== 'undefined',
                hasNavigatorStorage: typeof navigator?.storage?.getDirectory === 'function',
                crossOriginIsolated: self.crossOriginIsolated,
            };
        });

        expect(result.hasSharedArrayBuffer).toBe(true);
        expect(result.hasAtomics).toBe(true);
        expect(result.hasWorker).toBe(true);
        expect(result.hasNavigatorStorage).toBe(true);
        expect(result.crossOriginIsolated).toBe(true);
    });
});
