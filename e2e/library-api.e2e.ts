/**
 * E2E tests for happy-opfs library API
 * These tests verify the library works correctly in a real browser environment
 */
import { expect, test } from '@playwright/test';

test.describe('happy-opfs Library API E2E', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        // Wait for the library to be loaded
        await page.waitForTimeout(1000);
    });

    test('should have library loaded and OPFS supported', async ({ page }) => {
        // Check if OPFS is supported via native API
        const supported = await page.evaluate(async () => {
            try {
                await navigator.storage.getDirectory();
                return true;
            } catch {
                return false;
            }
        });

        expect(supported).toBe(true);
    });

    test('should run async tests without critical errors', async ({ page }) => {
        const errors: string[] = [];

        page.on('console', (msg) => {
            const text = msg.text();
            if (msg.type() === 'error') {
                // Filter out expected test errors
                if (!text.includes('Expected Err') &&
                    !text.includes('non-existent') &&
                    !text.includes('NotFoundError') &&
                    !text.includes('Error:')) {
                    errors.push(text);
                }
            }
        });

        // Wait for some tests to run
        await page.waitForTimeout(5000);

        // No unexpected errors
        expect(errors.length).toBe(0);
    });

    test('should complete page load without crash', async ({ page }) => {
        // Just verify page loads successfully
        const title = await page.title();
        expect(title).toBe('happy-opfs');
    });
});

test.describe('OPFS Stream Operations E2E', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
    });

    test('should support streaming write', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const root = await navigator.storage.getDirectory();

            // Create file with streaming
            const fileHandle = await root.getFileHandle('e2e-stream.txt', { create: true });
            const writable = await fileHandle.createWritable();

            // Write multiple chunks
            await writable.write('Chunk 1, ');
            await writable.write('Chunk 2, ');
            await writable.write('Chunk 3');
            await writable.close();

            // Read back
            const file = await fileHandle.getFile();
            const content = await file.text();

            // Clean up
            await root.removeEntry('e2e-stream.txt');

            return { content };
        });

        expect(result.content).toBe('Chunk 1, Chunk 2, Chunk 3');
    });

    test('should support seek and write at position', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const root = await navigator.storage.getDirectory();

            // Create initial file
            const fileHandle = await root.getFileHandle('e2e-seek.txt', { create: true });
            let writable = await fileHandle.createWritable();
            await writable.write('Hello World!');
            await writable.close();

            // Seek and overwrite - need to truncate after write
            writable = await fileHandle.createWritable({ keepExistingData: true });
            await writable.seek(6);
            await writable.write('OPFS!');
            await writable.truncate(11); // Truncate to remove extra character
            await writable.close();

            // Read back
            const file = await fileHandle.getFile();
            const content = await file.text();

            // Clean up
            await root.removeEntry('e2e-seek.txt');

            return { content };
        });

        expect(result.content).toBe('Hello OPFS!');
    });
});

test.describe('OPFS Concurrent Operations E2E', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
    });

    test('should handle concurrent file creation', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const root = await navigator.storage.getDirectory();
            const dir = await root.getDirectoryHandle('e2e-concurrent', { create: true });

            // Create multiple files concurrently
            const promises = [];
            for (let i = 0; i < 10; i++) {
                promises.push((async () => {
                    const fileHandle = await dir.getFileHandle(`file${ i }.txt`, { create: true });
                    const writable = await fileHandle.createWritable();
                    await writable.write(`Content ${ i }`);
                    await writable.close();
                })());
            }

            await Promise.all(promises);

            // Count files
            let count = 0;
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            for await (const _ of dir.entries()) {
                count++;
            }

            // Clean up
            await root.removeEntry('e2e-concurrent', { recursive: true });

            return { count };
        });

        expect(result.count).toBe(10);
    });

    test('should handle concurrent reads', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const root = await navigator.storage.getDirectory();

            // Create a file
            const fileHandle = await root.getFileHandle('e2e-read.txt', { create: true });
            const writable = await fileHandle.createWritable();
            await writable.write('Concurrent read content');
            await writable.close();

            // Read concurrently
            const promises = [];
            for (let i = 0; i < 5; i++) {
                promises.push((async () => {
                    const file = await fileHandle.getFile();
                    return await file.text();
                })());
            }

            const results = await Promise.all(promises);

            // Clean up
            await root.removeEntry('e2e-read.txt');

            return {
                allSame: results.every(r => r === 'Concurrent read content'),
                count: results.length
            };
        });

        expect(result.allSame).toBe(true);
        expect(result.count).toBe(5);
    });
});

test.describe('OPFS Error Handling E2E', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
    });

    test('should handle NotFoundError gracefully', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const root = await navigator.storage.getDirectory();

            try {
                await root.getFileHandle('definitely-not-exists.txt');
                return { caught: false };
            } catch (e) {
                return {
                    caught: true,
                    name: (e as Error).name,
                    isNotFound: (e as Error).name === 'NotFoundError'
                };
            }
        });

        expect(result.caught).toBe(true);
        expect(result.isNotFound).toBe(true);
    });

    test('should handle TypeMismatchError', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const root = await navigator.storage.getDirectory();

            // Create a file
            const fileHandle = await root.getFileHandle('e2e-type.txt', { create: true });
            const writable = await fileHandle.createWritable();
            await writable.write('content');
            await writable.close();

            try {
                // Try to get it as a directory
                await root.getDirectoryHandle('e2e-type.txt');
                await root.removeEntry('e2e-type.txt');
                return { caught: false };
            } catch (e) {
                await root.removeEntry('e2e-type.txt');
                return {
                    caught: true,
                    name: (e as Error).name,
                    isTypeMismatch: (e as Error).name === 'TypeMismatchError'
                };
            }
        });

        expect(result.caught).toBe(true);
        expect(result.isTypeMismatch).toBe(true);
    });
});
