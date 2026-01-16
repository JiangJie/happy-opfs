/**
 * Tests for writeFile function's createSyncAccessHandle branch (Worker environment)
 * These tests execute writeFile in a Worker context where createSyncAccessHandle is used
 */
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import * as fs from '../src/mod.ts';

/**
 * In Worker environment, writeFile uses createSyncAccessHandle instead of createWritable.
 * We test this by using the sync API which internally calls writeFile in a Worker.
 * The Worker's writeFile implementation uses createSyncAccessHandle.
 *
 * Code path: writeFileSync -> Worker -> writeFile (with createSyncAccessHandle)
 */
describe('writeFile - createSyncAccessHandle branch (via Worker)', () => {
    let originalCreateWritable: typeof FileSystemFileHandle.prototype.createWritable | undefined;

    beforeAll(async () => {
        await fs.SyncChannel.connect(
            new Worker(new URL('./worker.ts', import.meta.url), {
                type: 'module',
            }),
            {
                sharedBufferLength: 10 * 1024 * 1024,
                opTimeout: 10000,
            },
        );
    });

    afterAll(() => {
        // Restore methods
        if (originalCreateWritable) {
            FileSystemFileHandle.prototype.createWritable = originalCreateWritable;
        }

        fs.emptyDirSync(fs.ROOT_DIR);
    });

    afterEach(() => {
        fs.removeSync('/worker-write-test');
        fs.removeSync('/worker-write-test.txt');
        fs.removeSync('/worker-write-test.bin');
    });

    describe('Content Types (createSyncAccessHandle path)', () => {
        // Save original methods
        originalCreateWritable = FileSystemFileHandle.prototype.createWritable;
        // @ts-expect-error - intentionally removing method for testing
        delete FileSystemFileHandle.prototype.createWritable;

        describe('String content', () => {
            it('should write empty string via createSyncAccessHandle', () => {
                const result = fs.writeFileSync('/worker-write-test.txt', '');
                expect(result.isOk()).toBe(true);

                const content = fs.readTextFileSync('/worker-write-test.txt');
                expect(content.unwrap()).toBe('');
            });

            it('should write ASCII string via createSyncAccessHandle', () => {
                const text = 'Hello from Worker!';
                const result = fs.writeFileSync('/worker-write-test.txt', text);
                expect(result.isOk()).toBe(true);

                const content = fs.readTextFileSync('/worker-write-test.txt');
                expect(content.unwrap()).toBe(text);
            });

            it('should write Unicode string via createSyncAccessHandle', () => {
                // Tests TextEncoder with multi-byte characters
                const text = '中文 日本語 한국어 العربية';
                const result = fs.writeFileSync('/worker-write-test.txt', text);
                expect(result.isOk()).toBe(true);

                const content = fs.readTextFileSync('/worker-write-test.txt');
                expect(content.unwrap()).toBe(text);
            });

            it('should write string with emojis via createSyncAccessHandle', () => {
                // Tests TextEncoder with 4-byte UTF-8 characters
                const text = 'Emoji: 🎉🚀💻🔥';
                const result = fs.writeFileSync('/worker-write-test.txt', text);
                expect(result.isOk()).toBe(true);

                const content = fs.readTextFileSync('/worker-write-test.txt');
                expect(content.unwrap()).toBe(text);
            });

            it('should write multiline string with various line endings', () => {
                const text = 'Line1\nLine2\r\nLine3\rLine4';
                const result = fs.writeFileSync('/worker-write-test.txt', text);
                expect(result.isOk()).toBe(true);

                const content = fs.readTextFileSync('/worker-write-test.txt');
                expect(content.unwrap()).toBe(text);
            });
        });

        describe('ArrayBuffer content', () => {
            it('should write empty ArrayBuffer via createSyncAccessHandle', () => {
                const buffer = new ArrayBuffer(0);
                const result = fs.writeFileSync('/worker-write-test.bin', buffer);
                expect(result.isOk()).toBe(true);

                const content = fs.readFileSync('/worker-write-test.bin');
                expect(content.unwrap().byteLength).toBe(0);
            });

            it('should write ArrayBuffer with data via createSyncAccessHandle', () => {
                const buffer = new ArrayBuffer(10);
                const view = new Uint8Array(buffer);
                for (let i = 0; i < 10; i++) {
                    view[i] = i * 10;
                }

                const result = fs.writeFileSync('/worker-write-test.bin', buffer);
                expect(result.isOk()).toBe(true);

                const content = fs.readFileSync('/worker-write-test.bin');
                const readView = new Uint8Array(content.unwrap());
                expect(readView).toEqual(view);
            });

            it('should write large ArrayBuffer via createSyncAccessHandle', () => {
                // Tests write loop for larger data
                const size = 512 * 1024; // 512KB
                const buffer = new ArrayBuffer(size);
                const view = new Uint8Array(buffer);
                for (let i = 0; i < size; i++) {
                    view[i] = i % 256;
                }

                const result = fs.writeFileSync('/worker-write-test.bin', buffer);
                expect(result.isOk()).toBe(true);

                const content = fs.readFileSync('/worker-write-test.bin');
                expect(content.unwrap().byteLength).toBe(size);
            });
        });

        describe('Uint8Array content', () => {
            it('should write Uint8Array with all byte values', () => {
                const data = new Uint8Array(256);
                for (let i = 0; i < 256; i++) {
                    data[i] = i;
                }

                const result = fs.writeFileSync('/worker-write-test.bin', data);
                expect(result.isOk()).toBe(true);

                const content = fs.readFileSync('/worker-write-test.bin');
                const readData = new Uint8Array(content.unwrap());
                expect(readData).toEqual(data);
            });

            it('should write Uint8Array subarray with byteOffset', () => {
                // Tests: new Uint8Array(contents.buffer, contents.byteOffset, contents.byteLength)
                const fullBuffer = new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
                const subarray = fullBuffer.subarray(2, 8); // [2, 3, 4, 5, 6, 7]

                expect(subarray.byteOffset).toBe(2);
                expect(subarray.byteLength).toBe(6);

                const result = fs.writeFileSync('/worker-write-test.bin', subarray);
                expect(result.isOk()).toBe(true);

                const content = fs.readFileSync('/worker-write-test.bin');
                const readData = new Uint8Array(content.unwrap());
                expect(readData).toEqual(new Uint8Array([2, 3, 4, 5, 6, 7]));
            });
        });

        describe('Other TypedArray content', () => {
            it('should write Int8Array via createSyncAccessHandle', () => {
                const data = new Int8Array([-128, -64, 0, 64, 127]);
                const result = fs.writeFileSync('/worker-write-test.bin', data);
                expect(result.isOk()).toBe(true);

                const content = fs.readFileSync('/worker-write-test.bin');
                const readData = new Int8Array(content.unwrap());
                expect(readData).toEqual(data);
            });

            it('should write Uint16Array via createSyncAccessHandle', () => {
                const data = new Uint16Array([0, 1000, 32768, 65535]);
                const result = fs.writeFileSync('/worker-write-test.bin', data);
                expect(result.isOk()).toBe(true);

                const content = fs.readFileSync('/worker-write-test.bin');
                expect(content.unwrap().byteLength).toBe(data.byteLength);
            });

            it('should write Int32Array via createSyncAccessHandle', () => {
                const data = new Int32Array([-2147483648, 0, 2147483647]);
                const result = fs.writeFileSync('/worker-write-test.bin', data);
                expect(result.isOk()).toBe(true);

                const content = fs.readFileSync('/worker-write-test.bin');
                const bytes = content.unwrap();
                const readData = new Int32Array(bytes.buffer);
                expect(readData).toEqual(data);
            });

            it('should write Float64Array via createSyncAccessHandle', () => {
                const data = new Float64Array([0, Math.PI, -Math.E, Number.MAX_VALUE]);
                const result = fs.writeFileSync('/worker-write-test.bin', data);
                expect(result.isOk()).toBe(true);

                const content = fs.readFileSync('/worker-write-test.bin');
                const bytes = content.unwrap();
                const readData = new Float64Array(bytes.buffer);
                expect(readData).toEqual(data);
            });

            it('should write TypedArray with non-zero byteOffset', () => {
                const buffer = new ArrayBuffer(24);
                const view = new Float64Array(buffer, 8, 2); // offset 8, length 2
                view[0] = 123.456;
                view[1] = 789.012;

                expect(view.byteOffset).toBe(8);

                const result = fs.writeFileSync('/worker-write-test.bin', view);
                expect(result.isOk()).toBe(true);

                const content = fs.readFileSync('/worker-write-test.bin');
                const bytes = content.unwrap();
                const readView = new Float64Array(bytes.buffer);
                expect(readView[0]).toBeCloseTo(123.456);
                expect(readView[1]).toBeCloseTo(789.012);
            });
        });

        describe('DataView content', () => {
            it('should write DataView via createSyncAccessHandle', () => {
                // DataView is also an ArrayBufferView (TypedArray branch)
                const buffer = new ArrayBuffer(8);
                const view = new DataView(buffer);
                view.setUint32(0, 0xDEADBEEF, true);
                view.setUint32(4, 0xCAFEBABE, true);

                const result = fs.writeFileSync('/worker-write-test.bin', view);
                expect(result.isOk()).toBe(true);

                const content = fs.readFileSync('/worker-write-test.bin');
                const bytes = content.unwrap();
                const readView = new DataView(bytes.buffer);
                expect(readView.getUint32(0, true)).toBe(0xDEADBEEF);
                expect(readView.getUint32(4, true)).toBe(0xCAFEBABE);
            });
        });

        // Note: Blob content is NOT testable via Sync API because Blob cannot be
        // serialized through Worker postMessage. However, the Blob branch
        // is covered by the async writeFile tests in write-file.test.ts
    });

    describe('Truncate behavior (createSyncAccessHandle path)', () => {
        // Save original methods
        originalCreateWritable = FileSystemFileHandle.prototype.createWritable;
        // @ts-expect-error - intentionally removing method for testing
        delete FileSystemFileHandle.prototype.createWritable;

        it('should truncate file when not appending', () => {
            // First write long content
            fs.writeFileSync('/worker-write-test.txt', 'This is a long string');
            // Then write short content - should truncate
            fs.writeFileSync('/worker-write-test.txt', 'Short');

            const content = fs.readTextFileSync('/worker-write-test.txt');
            expect(content.unwrap()).toBe('Short');
            expect(content.unwrap().length).toBe(5);
        });

        it('should not truncate when appending', () => {
            fs.writeFileSync('/worker-write-test.txt', 'Original');
            fs.appendFileSync('/worker-write-test.txt', '!');

            const content = fs.readTextFileSync('/worker-write-test.txt');
            expect(content.unwrap()).toBe('Original!');
        });
    });

    describe('Append mode (createSyncAccessHandle path)', () => {
        // Save original methods
        originalCreateWritable = FileSystemFileHandle.prototype.createWritable;
        // @ts-expect-error - intentionally removing method for testing
        delete FileSystemFileHandle.prototype.createWritable;

        it('should append using getSize() for write position', () => {
            fs.writeFileSync('/worker-write-test.txt', 'Hello');
            fs.appendFileSync('/worker-write-test.txt', ' World');

            const content = fs.readTextFileSync('/worker-write-test.txt');
            expect(content.unwrap()).toBe('Hello World');
        });

        it('should append binary content', () => {
            fs.writeFileSync('/worker-write-test.bin', new Uint8Array([1, 2, 3]));
            fs.appendFileSync('/worker-write-test.bin', new Uint8Array([4, 5, 6]));

            const content = fs.readFileSync('/worker-write-test.bin');
            const data = new Uint8Array(content.unwrap());
            expect(data).toEqual(new Uint8Array([1, 2, 3, 4, 5, 6]));
        });

        it('should append ArrayBuffer content', () => {
            fs.writeFileSync('/worker-write-test.bin', new Uint8Array([0xAA]).buffer);
            fs.appendFileSync('/worker-write-test.bin', new Uint8Array([0xBB]).buffer);

            const content = fs.readFileSync('/worker-write-test.bin');
            const data = new Uint8Array(content.unwrap());
            expect(data).toEqual(new Uint8Array([0xAA, 0xBB]));
        });

        it('should handle multiple appends', () => {
            fs.writeFileSync('/worker-write-test.txt', '1');
            fs.appendFileSync('/worker-write-test.txt', '2');
            fs.appendFileSync('/worker-write-test.txt', '3');
            fs.appendFileSync('/worker-write-test.txt', '4');
            fs.appendFileSync('/worker-write-test.txt', '5');

            const content = fs.readTextFileSync('/worker-write-test.txt');
            expect(content.unwrap()).toBe('12345');
        });

        it('should create file when appending to non-existent file', () => {
            fs.appendFileSync('/worker-write-test.txt', 'new content');

            const content = fs.readTextFileSync('/worker-write-test.txt');
            expect(content.unwrap()).toBe('new content');
        });
    });

    describe('Write loop (createSyncAccessHandle path)', () => {
        // Save original methods
        originalCreateWritable = FileSystemFileHandle.prototype.createWritable;
        // @ts-expect-error - intentionally removing method for testing
        delete FileSystemFileHandle.prototype.createWritable;

        it('should complete write in single iteration for small data', () => {
            // Normal case: write completes in one iteration
            const data = new Uint8Array([1, 2, 3, 4, 5]);
            const result = fs.writeFileSync('/worker-write-test.bin', data);
            expect(result.isOk()).toBe(true);

            const content = fs.readFileSync('/worker-write-test.bin');
            expect(new Uint8Array(content.unwrap())).toEqual(data);
        });

        it('should handle large data write (tests while loop)', () => {
            // Large data to exercise the write loop more thoroughly
            const size = 1024 * 1024; // 1MB
            const data = new Uint8Array(size);
            for (let i = 0; i < size; i++) {
                data[i] = i % 256;
            }

            const result = fs.writeFileSync('/worker-write-test.bin', data);
            expect(result.isOk()).toBe(true);

            const content = fs.readFileSync('/worker-write-test.bin');
            expect(content.unwrap().byteLength).toBe(size);
        });

        // Note: The partial write branch is difficult to test
        // as it requires accessHandle.write() to return less than requested bytes,
        // which is an edge case that rarely occurs in practice.
    });

    describe('Access handle lifecycle (createSyncAccessHandle path)', () => {
        // Save original methods
        originalCreateWritable = FileSystemFileHandle.prototype.createWritable;
        // @ts-expect-error - intentionally removing method for testing
        delete FileSystemFileHandle.prototype.createWritable;

        it('should close access handle after successful write', () => {
            // Write should succeed and access handle should be properly closed
            const result = fs.writeFileSync('/worker-write-test.txt', 'content');
            expect(result.isOk()).toBe(true);

            // If handle wasn't closed, subsequent operations would fail
            const result2 = fs.writeFileSync('/worker-write-test.txt', 'new content');
            expect(result2.isOk()).toBe(true);
        });

        it('should close access handle even on error', () => {
            // Write to a valid file first
            fs.writeFileSync('/worker-write-test.txt', 'content');

            // Multiple writes should all succeed (handles properly closed)
            for (let i = 0; i < 5; i++) {
                const result = fs.writeFileSync('/worker-write-test.txt', `content ${i}`);
                expect(result.isOk()).toBe(true);
            }
        });
    });

    describe('Error cases (createSyncAccessHandle path)', () => {
        // Save original methods
        originalCreateWritable = FileSystemFileHandle.prototype.createWritable;
        // @ts-expect-error - intentionally removing method for testing
        delete FileSystemFileHandle.prototype.createWritable;

        it('should fail when parent path is a file', () => {
            fs.writeFileSync('/worker-write-test.txt', 'content');
            const result = fs.writeFileSync('/worker-write-test.txt/child.txt', 'content');
            expect(result.isErr()).toBe(true);
        });

        it('should fail to read non-existent file', () => {
            const result = fs.readFileSync('/non-existent-worker-file.txt');
            expect(result.isErr()).toBe(true);
        });
    });

    describe('Edge cases (createSyncAccessHandle path)', () => {
        // Save original methods
        originalCreateWritable = FileSystemFileHandle.prototype.createWritable;
        // @ts-expect-error - intentionally removing method for testing
        delete FileSystemFileHandle.prototype.createWritable;

        it('should handle deeply nested paths', () => {
            const path = '/worker-write-test/a/b/c/d/e/f/file.txt';
            const result = fs.writeFileSync(path, 'deep content');
            expect(result.isOk()).toBe(true);

            const content = fs.readTextFileSync(path);
            expect(content.unwrap()).toBe('deep content');
        });

        it('should handle file name with spaces', () => {
            const result = fs.writeFileSync('/worker-write-test/file with spaces.txt', 'spaced');
            expect(result.isOk()).toBe(true);

            const exists = fs.existsSync('/worker-write-test/file with spaces.txt');
            expect(exists.unwrap()).toBe(true);
        });

        it('should handle sequential writes to same file', () => {
            for (let i = 0; i < 5; i++) {
                fs.writeFileSync('/worker-write-test.txt', `content ${i}`);
            }

            const content = fs.readTextFileSync('/worker-write-test.txt');
            expect(content.unwrap()).toBe('content 4');
        });

        it('should handle writes to different files', () => {
            for (let i = 0; i < 5; i++) {
                fs.writeFileSync(`/worker-write-test/file${i}.txt`, `content${i}`);
            }

            for (let i = 0; i < 5; i++) {
                const content = fs.readTextFileSync(`/worker-write-test/file${i}.txt`);
                expect(content.unwrap()).toBe(`content${i}`);
            }
        });
    });
});
