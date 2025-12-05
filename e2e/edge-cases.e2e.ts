/**
 * E2E tests for edge cases and boundary conditions
 * Tests various special scenarios in a real browser environment
 */
import { test, expect } from '@playwright/test';

test.describe('OPFS Edge Cases E2E', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
    });

    describe('Special file names', () => {
        test('should handle file names with spaces', async ({ page }) => {
            const result = await page.evaluate(async () => {
                const root = await navigator.storage.getDirectory();
                const fileName = 'file with spaces.txt';

                try {
                    const fileHandle = await root.getFileHandle(fileName, { create: true });
                    const writable = await fileHandle.createWritable();
                    await writable.write('content');
                    await writable.close();

                    const file = await fileHandle.getFile();
                    const content = await file.text();

                    await root.removeEntry(fileName);

                    return { success: true, name: file.name, content };
                } catch (e) {
                    return { success: false, error: String(e) };
                }
            });

            expect(result.success).toBe(true);
            expect(result.name).toBe('file with spaces.txt');
            expect(result.content).toBe('content');
        });

        test('should handle file names with unicode characters', async ({ page }) => {
            const result = await page.evaluate(async () => {
                const root = await navigator.storage.getDirectory();
                const fileName = '中文文件名.txt';

                try {
                    const fileHandle = await root.getFileHandle(fileName, { create: true });
                    const writable = await fileHandle.createWritable();
                    await writable.write('中文内容');
                    await writable.close();

                    const file = await fileHandle.getFile();
                    const content = await file.text();

                    await root.removeEntry(fileName);

                    return { success: true, name: file.name, content };
                } catch (e) {
                    return { success: false, error: String(e) };
                }
            });

            expect(result.success).toBe(true);
            expect(result.name).toBe('中文文件名.txt');
            expect(result.content).toBe('中文内容');
        });

        test('should handle file names with emojis', async ({ page }) => {
            const result = await page.evaluate(async () => {
                const root = await navigator.storage.getDirectory();
                const fileName = '🎉test🎉.txt';

                try {
                    const fileHandle = await root.getFileHandle(fileName, { create: true });
                    const writable = await fileHandle.createWritable();
                    await writable.write('emoji content');
                    await writable.close();

                    const file = await fileHandle.getFile();
                    const content = await file.text();

                    await root.removeEntry(fileName);

                    return { success: true, name: file.name, content };
                } catch (e) {
                    return { success: false, error: String(e) };
                }
            });

            expect(result.success).toBe(true);
            expect(result.content).toBe('emoji content');
        });

        test('should handle file names with dots', async ({ page }) => {
            const result = await page.evaluate(async () => {
                const root = await navigator.storage.getDirectory();
                const fileName = 'file.multiple.dots.txt';

                try {
                    const fileHandle = await root.getFileHandle(fileName, { create: true });
                    const writable = await fileHandle.createWritable();
                    await writable.write('content');
                    await writable.close();

                    const file = await fileHandle.getFile();

                    await root.removeEntry(fileName);

                    return { success: true, name: file.name };
                } catch (e) {
                    return { success: false, error: String(e) };
                }
            });

            expect(result.success).toBe(true);
            expect(result.name).toBe('file.multiple.dots.txt');
        });
    });

    describe('Binary data handling', () => {
        test('should handle all byte values (0-255)', async ({ page }) => {
            const result = await page.evaluate(async () => {
                const root = await navigator.storage.getDirectory();

                try {
                    const fileHandle = await root.getFileHandle('binary-test.bin', { create: true });
                    
                    // Create array with all byte values
                    const data = new Uint8Array(256);
                    for (let i = 0; i < 256; i++) {
                        data[i] = i;
                    }

                    const writable = await fileHandle.createWritable();
                    await writable.write(data);
                    await writable.close();

                    const file = await fileHandle.getFile();
                    const buffer = await file.arrayBuffer();
                    const readData = new Uint8Array(buffer);

                    await root.removeEntry('binary-test.bin');

                    // Verify all bytes
                    let match = true;
                    for (let i = 0; i < 256; i++) {
                        if (readData[i] !== i) {
                            match = false;
                            break;
                        }
                    }

                    return { success: true, size: readData.length, match };
                } catch (e) {
                    return { success: false, error: String(e) };
                }
            });

            expect(result.success).toBe(true);
            expect(result.size).toBe(256);
            expect(result.match).toBe(true);
        });

        test('should handle empty files', async ({ page }) => {
            const result = await page.evaluate(async () => {
                const root = await navigator.storage.getDirectory();

                try {
                    const fileHandle = await root.getFileHandle('empty.txt', { create: true });
                    const writable = await fileHandle.createWritable();
                    await writable.close();

                    const file = await fileHandle.getFile();

                    await root.removeEntry('empty.txt');

                    return { success: true, size: file.size };
                } catch (e) {
                    return { success: false, error: String(e) };
                }
            });

            expect(result.success).toBe(true);
            expect(result.size).toBe(0);
        });
    });

    describe('Large file handling', () => {
        test('should handle 1MB file', async ({ page }) => {
            const result = await page.evaluate(async () => {
                const root = await navigator.storage.getDirectory();
                const size = 1024 * 1024; // 1MB

                try {
                    const fileHandle = await root.getFileHandle('large.bin', { create: true });
                    
                    const data = new Uint8Array(size);
                    for (let i = 0; i < size; i++) {
                        data[i] = i % 256;
                    }

                    const writable = await fileHandle.createWritable();
                    await writable.write(data);
                    await writable.close();

                    const file = await fileHandle.getFile();

                    await root.removeEntry('large.bin');

                    return { success: true, size: file.size };
                } catch (e) {
                    return { success: false, error: String(e) };
                }
            });

            expect(result.success).toBe(true);
            expect(result.size).toBe(1024 * 1024);
        });
    });

    describe('Concurrent operations', () => {
        test('should handle concurrent file creation', async ({ page }) => {
            const result = await page.evaluate(async () => {
                const root = await navigator.storage.getDirectory();
                const dir = await root.getDirectoryHandle('e2e-concurrent', { create: true });

                try {
                    const promises = [];
                    for (let i = 0; i < 20; i++) {
                        promises.push((async () => {
                            const fileHandle = await dir.getFileHandle(`file${i}.txt`, { create: true });
                            const writable = await fileHandle.createWritable();
                            await writable.write(`Content ${i}`);
                            await writable.close();
                        })());
                    }

                    await Promise.all(promises);

                    // Count files
                    let count = 0;
                    for await (const _ of dir.entries()) {
                        count++;
                    }

                    await root.removeEntry('e2e-concurrent', { recursive: true });

                    return { success: true, count };
                } catch (e) {
                    try { await root.removeEntry('e2e-concurrent', { recursive: true }); } catch {}
                    return { success: false, error: String(e) };
                }
            });

            expect(result.success).toBe(true);
            expect(result.count).toBe(20);
        });

        test('should handle concurrent reads to same file', async ({ page }) => {
            const result = await page.evaluate(async () => {
                const root = await navigator.storage.getDirectory();

                try {
                    const fileHandle = await root.getFileHandle('concurrent-read.txt', { create: true });
                    const writable = await fileHandle.createWritable();
                    await writable.write('Shared content for concurrent reading');
                    await writable.close();

                    // Concurrent reads
                    const promises = [];
                    for (let i = 0; i < 10; i++) {
                        promises.push((async () => {
                            const file = await fileHandle.getFile();
                            return await file.text();
                        })());
                    }

                    const results = await Promise.all(promises);

                    await root.removeEntry('concurrent-read.txt');

                    const allMatch = results.every(r => r === 'Shared content for concurrent reading');

                    return { success: true, count: results.length, allMatch };
                } catch (e) {
                    return { success: false, error: String(e) };
                }
            });

            expect(result.success).toBe(true);
            expect(result.count).toBe(10);
            expect(result.allMatch).toBe(true);
        });
    });

    describe('Error recovery', () => {
        test('should recover from failed operations', async ({ page }) => {
            const result = await page.evaluate(async () => {
                const root = await navigator.storage.getDirectory();

                try {
                    // Try to get non-existent file (should fail)
                    let caught = false;
                    try {
                        await root.getFileHandle('non-existent-file.txt');
                    } catch {
                        caught = true;
                    }

                    if (!caught) {
                        return { success: false, error: 'Should have thrown for non-existent file' };
                    }

                    // Should be able to continue with normal operations
                    const fileHandle = await root.getFileHandle('recovery-test.txt', { create: true });
                    const writable = await fileHandle.createWritable();
                    await writable.write('Recovery successful');
                    await writable.close();

                    const file = await fileHandle.getFile();
                    const content = await file.text();

                    await root.removeEntry('recovery-test.txt');

                    return { success: true, content };
                } catch (e) {
                    return { success: false, error: String(e) };
                }
            });

            expect(result.success).toBe(true);
            expect(result.content).toBe('Recovery successful');
        });
    });

    describe('File metadata', () => {
        test('should preserve file metadata', async ({ page }) => {
            const result = await page.evaluate(async () => {
                const root = await navigator.storage.getDirectory();

                try {
                    const fileHandle = await root.getFileHandle('metadata-test.txt', { create: true });
                    const writable = await fileHandle.createWritable();
                    await writable.write('Test content');
                    await writable.close();

                    const file = await fileHandle.getFile();

                    await root.removeEntry('metadata-test.txt');

                    return {
                        success: true,
                        name: file.name,
                        size: file.size,
                        type: file.type,
                        hasLastModified: typeof file.lastModified === 'number' && file.lastModified > 0,
                    };
                } catch (e) {
                    return { success: false, error: String(e) };
                }
            });

            expect(result.success).toBe(true);
            expect(result.name).toBe('metadata-test.txt');
            expect(result.size).toBe(12); // 'Test content'.length
            expect(result.hasLastModified).toBe(true);
        });
    });
});
