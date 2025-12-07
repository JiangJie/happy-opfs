/**
 * Tests for worker operations - covers various operation branches in opfs_worker.ts
 * Tests all WorkerAsyncOp operations through their sync API counterparts
 */
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import * as fs from '../src/mod.ts';

describe('Worker Operations Coverage', () => {
    beforeAll(async () => {
        await fs.connectSyncAgent({
            worker: new Worker(new URL('./worker.ts', import.meta.url), {
                type: 'module'
            }),
            bufferLength: 10 * 1024 * 1024,
            opTimeout: 5000,
        });
    });

    afterAll(() => {
        fs.emptyDirSync(fs.ROOT_DIR);
    });

    afterEach(() => {
        fs.removeSync('/worker-op-test');
        fs.removeSync('/worker-op-file.txt');
        fs.removeSync('/worker-op-dest');
        fs.deleteTempSync();
    });

    describe('WorkerAsyncOp.createFile', () => {
        it('should create file via worker', () => {
            const result = fs.createFileSync('/worker-op-file.txt');
            expect(result.isOk()).toBe(true);
            expect(fs.existsSync('/worker-op-file.txt').unwrap()).toBe(true);
        });
    });

    describe('WorkerAsyncOp.mkdir', () => {
        it('should create directory via worker', () => {
            const result = fs.mkdirSync('/worker-op-test');
            expect(result.isOk()).toBe(true);
            expect(fs.existsSync('/worker-op-test', { isDirectory: true }).unwrap()).toBe(true);
        });
    });

    describe('WorkerAsyncOp.writeFile with various data types', () => {
        it('should handle string content', () => {
            const result = fs.writeFileSync('/worker-op-file.txt', 'string content');
            expect(result.isOk()).toBe(true);
        });

        it('should handle Uint8Array content', () => {
            const data = new Uint8Array([1, 2, 3, 4, 5]);
            const result = fs.writeFileSync('/worker-op-file.txt', data);
            expect(result.isOk()).toBe(true);

            const read = fs.readFileSync('/worker-op-file.txt');
            expect(new Uint8Array(read.unwrap())).toEqual(data);
        });

        it('should handle ArrayBuffer content', () => {
            const buffer = new ArrayBuffer(5);
            const view = new Uint8Array(buffer);
            view.set([10, 20, 30, 40, 50]);

            const result = fs.writeFileSync('/worker-op-file.txt', buffer);
            expect(result.isOk()).toBe(true);

            const read = fs.readFileSync('/worker-op-file.txt');
            expect(new Uint8Array(read.unwrap())).toEqual(view);
        });

        it('should handle TypedArray with byteOffset', () => {
            const buffer = new ArrayBuffer(10);
            const fullView = new Uint8Array(buffer);
            fullView.set([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);

            // Create a view with offset
            const offsetView = new Uint8Array(buffer, 3, 4); // [3, 4, 5, 6]

            const result = fs.writeFileSync('/worker-op-file.txt', offsetView);
            expect(result.isOk()).toBe(true);

            const read = fs.readFileSync('/worker-op-file.txt');
            const readData = new Uint8Array(read.unwrap());
            expect(readData).toEqual(new Uint8Array([3, 4, 5, 6]));
        });
    });

    describe('WorkerAsyncOp.appendFile with various data types', () => {
        it('should append string content', () => {
            fs.writeFileSync('/worker-op-file.txt', 'Hello');
            const result = fs.appendFileSync('/worker-op-file.txt', ' World');
            expect(result.isOk()).toBe(true);
            expect(fs.readTextFileSync('/worker-op-file.txt').unwrap()).toBe('Hello World');
        });

        it('should append Uint8Array content', () => {
            fs.writeFileSync('/worker-op-file.txt', new Uint8Array([1, 2]));
            const result = fs.appendFileSync('/worker-op-file.txt', new Uint8Array([3, 4]));
            expect(result.isOk()).toBe(true);

            const read = new Uint8Array(fs.readFileSync('/worker-op-file.txt').unwrap());
            expect(read).toEqual(new Uint8Array([1, 2, 3, 4]));
        });
    });

    describe('WorkerAsyncOp.readDir', () => {
        it('should read directory entries', () => {
            fs.mkdirSync('/worker-op-test');
            fs.writeFileSync('/worker-op-test/file1.txt', 'a');
            fs.mkdirSync('/worker-op-test/subdir');

            const result = fs.readDirSync('/worker-op-test');
            expect(result.isOk()).toBe(true);

            const entries = result.unwrap();
            expect(entries.length).toBe(2);

            // Verify handle like structure
            const fileEntry = entries.find(e => e.handle.kind === 'file');
            const dirEntry = entries.find(e => e.handle.kind === 'directory');
            expect(fileEntry).toBeDefined();
            expect(dirEntry).toBeDefined();
        });

        it('should read directory recursively', () => {
            fs.mkdirSync('/worker-op-test/sub1/sub2');
            fs.writeFileSync('/worker-op-test/file.txt', 'root');
            fs.writeFileSync('/worker-op-test/sub1/file.txt', 'sub1');
            fs.writeFileSync('/worker-op-test/sub1/sub2/file.txt', 'sub2');

            const result = fs.readDirSync('/worker-op-test', { recursive: true });
            expect(result.isOk()).toBe(true);

            const entries = result.unwrap();
            // sub1, sub1/sub2, file.txt, sub1/file.txt, sub1/sub2/file.txt
            expect(entries.length).toBe(5);
        });
    });

    describe('WorkerAsyncOp.stat', () => {
        it('should return file handle like', () => {
            fs.writeFileSync('/worker-op-file.txt', 'content');
            const result = fs.statSync('/worker-op-file.txt');
            expect(result.isOk()).toBe(true);

            const handle = result.unwrap();
            expect(handle.kind).toBe('file');
            expect(handle.name).toBe('worker-op-file.txt');
            expect(fs.isFileHandleLike(handle)).toBe(true);
        });

        it('should return directory handle like', () => {
            fs.mkdirSync('/worker-op-test');
            const result = fs.statSync('/worker-op-test');
            expect(result.isOk()).toBe(true);

            const handle = result.unwrap();
            expect(handle.kind).toBe('directory');
            expect(fs.isFileHandleLike(handle)).toBe(false);
        });
    });

    describe('WorkerAsyncOp.move', () => {
        it('should move file', () => {
            fs.writeFileSync('/worker-op-file.txt', 'content');
            const result = fs.moveSync('/worker-op-file.txt', '/worker-op-dest/moved.txt');
            expect(result.isOk()).toBe(true);

            expect(fs.existsSync('/worker-op-file.txt').unwrap()).toBe(false);
            expect(fs.existsSync('/worker-op-dest/moved.txt').unwrap()).toBe(true);
        });

        it('should move with overwrite option', () => {
            fs.writeFileSync('/worker-op-file.txt', 'new');
            fs.mkdirSync('/worker-op-dest');
            fs.writeFileSync('/worker-op-dest/target.txt', 'old');

            const result = fs.moveSync('/worker-op-file.txt', '/worker-op-dest/target.txt', { overwrite: true });
            expect(result.isOk()).toBe(true);

            expect(fs.readTextFileSync('/worker-op-dest/target.txt').unwrap()).toBe('new');
        });
    });

    describe('WorkerAsyncOp.copy', () => {
        it('should copy file', () => {
            fs.writeFileSync('/worker-op-file.txt', 'content');
            const result = fs.copySync('/worker-op-file.txt', '/worker-op-dest/copied.txt');
            expect(result.isOk()).toBe(true);

            expect(fs.existsSync('/worker-op-file.txt').unwrap()).toBe(true);
            expect(fs.existsSync('/worker-op-dest/copied.txt').unwrap()).toBe(true);
        });

        it('should copy with overwrite option', () => {
            fs.writeFileSync('/worker-op-file.txt', 'new');
            fs.mkdirSync('/worker-op-dest');
            fs.writeFileSync('/worker-op-dest/target.txt', 'old');

            const result = fs.copySync('/worker-op-file.txt', '/worker-op-dest/target.txt', { overwrite: true });
            expect(result.isOk()).toBe(true);

            expect(fs.readTextFileSync('/worker-op-dest/target.txt').unwrap()).toBe('new');
        });
    });

    describe('WorkerAsyncOp.emptyDir', () => {
        it('should empty existing directory', () => {
            fs.mkdirSync('/worker-op-test');
            fs.writeFileSync('/worker-op-test/file1.txt', 'a');
            fs.writeFileSync('/worker-op-test/file2.txt', 'b');

            const result = fs.emptyDirSync('/worker-op-test');
            expect(result.isOk()).toBe(true);

            const entries = fs.readDirSync('/worker-op-test').unwrap();
            expect(entries.length).toBe(0);
        });

        it('should create directory if not exists', () => {
            const result = fs.emptyDirSync('/worker-op-test');
            expect(result.isOk()).toBe(true);
            expect(fs.existsSync('/worker-op-test', { isDirectory: true }).unwrap()).toBe(true);
        });
    });

    describe('WorkerAsyncOp.exists', () => {
        it('should check file existence', () => {
            fs.writeFileSync('/worker-op-file.txt', 'content');

            expect(fs.existsSync('/worker-op-file.txt').unwrap()).toBe(true);
            expect(fs.existsSync('/non-existent').unwrap()).toBe(false);
        });

        it('should check with isFile option', () => {
            fs.writeFileSync('/worker-op-file.txt', 'content');
            fs.mkdirSync('/worker-op-test');

            expect(fs.existsSync('/worker-op-file.txt', { isFile: true }).unwrap()).toBe(true);
            expect(fs.existsSync('/worker-op-test', { isFile: true }).unwrap()).toBe(false);
        });

        it('should check with isDirectory option', () => {
            fs.writeFileSync('/worker-op-file.txt', 'content');
            fs.mkdirSync('/worker-op-test');

            expect(fs.existsSync('/worker-op-file.txt', { isDirectory: true }).unwrap()).toBe(false);
            expect(fs.existsSync('/worker-op-test', { isDirectory: true }).unwrap()).toBe(true);
        });
    });

    describe('WorkerAsyncOp.remove', () => {
        it('should remove file', () => {
            fs.writeFileSync('/worker-op-file.txt', 'content');
            const result = fs.removeSync('/worker-op-file.txt');
            expect(result.isOk()).toBe(true);
            expect(fs.existsSync('/worker-op-file.txt').unwrap()).toBe(false);
        });

        it('should remove directory recursively', () => {
            fs.mkdirSync('/worker-op-test/sub');
            fs.writeFileSync('/worker-op-test/file.txt', 'a');

            const result = fs.removeSync('/worker-op-test');
            expect(result.isOk()).toBe(true);
            expect(fs.existsSync('/worker-op-test').unwrap()).toBe(false);
        });
    });

    describe('WorkerAsyncOp.mkTemp', () => {
        it('should create temp file', () => {
            const result = fs.mkTempSync();
            expect(result.isOk()).toBe(true);

            const path = result.unwrap();
            expect(fs.isTempPath(path)).toBe(true);
            expect(fs.existsSync(path).unwrap()).toBe(true);
        });

        it('should create temp directory', () => {
            const result = fs.mkTempSync({ isDirectory: true });
            expect(result.isOk()).toBe(true);

            const path = result.unwrap();
            expect(fs.existsSync(path, { isDirectory: true }).unwrap()).toBe(true);
        });

        it('should create temp with custom basename and extname', () => {
            const result = fs.mkTempSync({ basename: 'mytemp', extname: '.log' });
            expect(result.isOk()).toBe(true);

            const path = result.unwrap();
            expect(path.startsWith('/tmp/mytemp-')).toBe(true);
            expect(path.endsWith('.log')).toBe(true);
        });
    });

    describe('WorkerAsyncOp.deleteTemp', () => {
        it('should delete temp directory', () => {
            fs.mkTempSync();
            expect(fs.existsSync(fs.TMP_DIR).unwrap()).toBe(true);

            const result = fs.deleteTempSync();
            expect(result.isOk()).toBe(true);
            expect(fs.existsSync(fs.TMP_DIR).unwrap()).toBe(false);
        });
    });

    describe('WorkerAsyncOp.pruneTemp', () => {
        it('should prune expired temp files', async () => {
            // Create a temp file
            const tempPath = fs.mkTempSync().unwrap();

            // Wait a bit
            await new Promise(resolve => setTimeout(resolve, 100));

            // Prune with a future date - should remove the file
            const result = fs.pruneTempSync(new Date());
            expect(result.isOk()).toBe(true);

            // File should be removed
            expect(fs.existsSync(tempPath).unwrap()).toBe(false);
        });

        it('should keep non-expired temp files', async () => {
            // Create a temp file
            const tempPath = fs.mkTempSync().unwrap();

            // Prune with a past date - should keep the file
            const pastDate = new Date(Date.now() - 1000000);
            const result = fs.pruneTempSync(pastDate);
            expect(result.isOk()).toBe(true);

            // File should still exist
            expect(fs.existsSync(tempPath).unwrap()).toBe(true);
        });
    });

    describe('WorkerAsyncOp.readBlobFile', () => {
        it('should read file as FileLike', () => {
            fs.writeFileSync('/worker-op-file.txt', 'blob content');
            const result = fs.readBlobFileSync('/worker-op-file.txt');
            expect(result.isOk()).toBe(true);

            const fileLike = result.unwrap();
            expect(fileLike.name).toBe('worker-op-file.txt');
            expect(fileLike.size).toBe(12);
            expect(fileLike.data).toBeInstanceOf(ArrayBuffer);
        });
    });

    describe('WorkerAsyncOp.zip', () => {
        it('should zip to file', () => {
            fs.mkdirSync('/worker-op-test');
            fs.writeFileSync('/worker-op-test/file.txt', 'content');

            const result = fs.zipSync('/worker-op-test', '/worker-op-dest/test.zip');
            expect(result.isOk()).toBe(true);
            expect(fs.existsSync('/worker-op-dest/test.zip').unwrap()).toBe(true);
        });

        it('should zip to Uint8Array', () => {
            fs.mkdirSync('/worker-op-test');
            fs.writeFileSync('/worker-op-test/file.txt', 'content');

            const result = fs.zipSync('/worker-op-test');
            expect(result.isOk()).toBe(true);

            const data = result.unwrap();
            expect(data).toBeInstanceOf(Uint8Array);
            expect(data.byteLength).toBeGreaterThan(0);
        });

        it('should zip with preserveRoot false', () => {
            fs.mkdirSync('/worker-op-test');
            fs.writeFileSync('/worker-op-test/file.txt', 'content');

            const result = fs.zipSync('/worker-op-test', { preserveRoot: false });
            expect(result.isOk()).toBe(true);
        });
    });

    describe('WorkerAsyncOp.unzip', () => {
        it('should unzip file', () => {
            // Create and zip a directory
            fs.mkdirSync('/worker-op-test');
            fs.writeFileSync('/worker-op-test/file.txt', 'content');
            fs.zipSync('/worker-op-test', '/worker-op-dest/test.zip');

            // Unzip
            const result = fs.unzipSync('/worker-op-dest/test.zip', '/worker-op-dest/extracted');
            expect(result.isOk()).toBe(true);

            // Verify extraction
            expect(fs.existsSync('/worker-op-dest/extracted/worker-op-test/file.txt').unwrap()).toBe(true);
        });
    });
});
