/**
 * Sync API operations tests using Vitest
 * Tests: createFileSync, mkdirSync, readFileSync, writeFileSync, removeSync, statSync, etc.
 */
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import * as fs from '../src/mod.ts';

describe('OPFS Sync Operations', () => {
    // Connect sync channel before all tests
    beforeAll(async () => {
        await fs.SyncChannel.connect(
            new Worker(new URL('./worker.ts', import.meta.url), {
                type: 'module',
            }),
            {
                sharedBufferLength: 10 * 1024 * 1024,
                opTimeout: 5000,
            },
        );
    });

    // Clean up after all tests
    afterAll(() => {
        fs.emptyDirSync(fs.ROOT_DIR);
    });

    describe('Sync Core - createFileSync', () => {
        afterEach(() => {
            fs.removeSync('/sync-create-file.txt');
            fs.removeSync('/sync-nested');
        });

        it('should create a new empty file', () => {
            const result = fs.createFileSync('/sync-create-file.txt');
            expect(result.isOk()).toBe(true);

            const exists = fs.existsSync('/sync-create-file.txt');
            expect(exists.unwrap()).toBe(true);
        });

        it('should create file with nested directories', () => {
            const result = fs.createFileSync('/sync-nested/dir/file.txt');
            expect(result.isOk()).toBe(true);

            const exists = fs.existsSync('/sync-nested/dir/file.txt');
            expect(exists.unwrap()).toBe(true);
        });
    });

    describe('Sync Core - mkdirSync', () => {
        afterEach(() => {
            fs.removeSync('/sync-mkdir');
            fs.removeSync('/sync-a');
        });

        it('should create a new directory', () => {
            const result = fs.mkdirSync('/sync-mkdir');
            expect(result.isOk()).toBe(true);

            const exists = fs.existsSync('/sync-mkdir', { isDirectory: true });
            expect(exists.unwrap()).toBe(true);
        });

        it('should create nested directories', () => {
            const result = fs.mkdirSync('/sync-a/b/c');
            expect(result.isOk()).toBe(true);

            const exists = fs.existsSync('/sync-a/b/c', { isDirectory: true });
            expect(exists.unwrap()).toBe(true);
        });
    });

    describe('Sync Core - writeFileSync & readFileSync', () => {
        afterEach(() => {
            fs.removeSync('/sync-string.txt');
            fs.removeSync('/sync-binary.bin');
            fs.removeSync('/sync-append.txt');
        });

        it('should write and read string content', () => {
            const content = 'Hello, Sync OPFS!';
            fs.writeFileSync('/sync-string.txt', content);

            const result = fs.readTextFileSync('/sync-string.txt');
            expect(result.unwrap()).toBe(content);
        });

        it('should write and read binary content', () => {
            const data = new Uint8Array([1, 2, 3, 4, 5]);
            fs.writeFileSync('/sync-binary.bin', data);

            const result = fs.readFileSync('/sync-binary.bin');
            const buffer = result.unwrap();
            expect(buffer.byteLength).toBe(5);
        });

        it('should append content', () => {
            fs.writeFileSync('/sync-append.txt', 'Hello');
            fs.appendFileSync('/sync-append.txt', ' World');

            const result = fs.readTextFileSync('/sync-append.txt');
            expect(result.unwrap()).toBe('Hello World');
        });

        it('should append to existing file with create: false', () => {
            fs.writeFileSync('/sync-append-create-false.txt', 'Hello');
            const result = fs.appendFileSync('/sync-append-create-false.txt', ' World', { create: false });
            expect(result.isOk()).toBe(true);

            const content = fs.readTextFileSync('/sync-append-create-false.txt');
            expect(content.unwrap()).toBe('Hello World');

            fs.removeSync('/sync-append-create-false.txt');
        });

        it('should fail to append with create: false when file not exists', () => {
            const result = fs.appendFileSync('/sync-append-no-create.txt', 'content', { create: false });
            expect(result.isErr()).toBe(true);
        });

        it('should fail to read non-existent file', () => {
            const result = fs.readFileSync('/sync-non-existent.txt');
            expect(result.isErr()).toBe(true);
        });
    });

    describe('Sync Core - readBlobFileSync', () => {
        afterEach(() => {
            fs.removeSync('/sync-blob.txt');
        });

        it('should read file as File', () => {
            fs.writeFileSync('/sync-blob.txt', 'Blob content');

            const result = fs.readBlobFileSync('/sync-blob.txt');
            const file = result.unwrap();

            expect(file.name).toBe('sync-blob.txt');
            expect(file.size).toBe(12);
            expect(file instanceof File).toBe(true);
        });
    });

    describe('Sync Core - readDirSync', () => {
        afterEach(() => {
            fs.removeSync('/sync-readdir');
            fs.removeSync('/sync-readdir-recursive');
        });

        it('should read directory entries', () => {
            fs.mkdirSync('/sync-readdir');
            fs.writeFileSync('/sync-readdir/file1.txt', 'a');
            fs.writeFileSync('/sync-readdir/file2.txt', 'b');
            fs.mkdirSync('/sync-readdir/subdir');

            const result = fs.readDirSync('/sync-readdir');
            const entries = result.unwrap();
            expect(entries.length).toBe(3);
        });

        it('should read directory recursively', () => {
            fs.mkdirSync('/sync-readdir-recursive/sub1');
            fs.mkdirSync('/sync-readdir-recursive/sub2');
            fs.writeFileSync('/sync-readdir-recursive/file.txt', 'root');
            fs.writeFileSync('/sync-readdir-recursive/sub1/file.txt', 'sub1');

            const result = fs.readDirSync('/sync-readdir-recursive', { recursive: true });
            const entries = result.unwrap();

            // sub1, sub2, file.txt, sub1/file.txt
            expect(entries.length).toBe(4);
        });
    });

    describe('Sync Core - statSync', () => {
        afterEach(() => {
            fs.removeSync('/sync-stat-file.txt');
            fs.removeSync('/sync-stat-dir');
        });

        it('should return file handle like for file', () => {
            fs.writeFileSync('/sync-stat-file.txt', 'content');

            const result = fs.statSync('/sync-stat-file.txt');
            const handleLike = result.unwrap();

            expect(fs.isFileHandleLike(handleLike)).toBe(true);
            expect(handleLike.name).toBe('sync-stat-file.txt');

            // Test FileSystemFileHandleLike properties
            if (fs.isFileHandleLike(handleLike)) {
                expect(handleLike.size).toBe(7); // 'content'.length
                expect(handleLike.lastModified).toBeGreaterThan(0);
            }
        });

        it('should return handle like for directory', () => {
            fs.mkdirSync('/sync-stat-dir');

            const result = fs.statSync('/sync-stat-dir');
            const handleLike = result.unwrap();

            expect(fs.isFileHandleLike(handleLike)).toBe(false);
            expect(fs.isDirectoryHandleLike(handleLike)).toBe(true);
            expect(handleLike.kind).toBe('directory');
        });
    });

    describe('Sync Core - removeSync', () => {
        it('should remove a file', () => {
            fs.writeFileSync('/sync-remove-file.txt', 'content');
            const result = fs.removeSync('/sync-remove-file.txt');
            expect(result.isOk()).toBe(true);

            const exists = fs.existsSync('/sync-remove-file.txt');
            expect(exists.unwrap()).toBe(false);
        });

        it('should remove a directory recursively', () => {
            fs.mkdirSync('/sync-remove-dir/sub');
            fs.writeFileSync('/sync-remove-dir/file.txt', 'a');

            const result = fs.removeSync('/sync-remove-dir');
            expect(result.isOk()).toBe(true);

            const exists = fs.existsSync('/sync-remove-dir');
            expect(exists.unwrap()).toBe(false);
        });

        it('should succeed for non-existent path', () => {
            const result = fs.removeSync('/sync-not-exists');
            expect(result.isOk()).toBe(true);
        });
    });

    describe('Sync Ext - copySync', () => {
        afterEach(() => {
            fs.removeSync('/sync-copy-src.txt');
            fs.removeSync('/sync-copy-dest.txt');
            fs.removeSync('/sync-copy-dir-src');
            fs.removeSync('/sync-copy-dir-dest');
            fs.removeSync('/sync-copy-no-src.txt');
            fs.removeSync('/sync-copy-no-dest.txt');
            fs.removeSync('/sync-copy-mismatch.txt');
            fs.removeSync('/sync-copy-mismatch-dir');
        });

        it('should copy a file', () => {
            fs.writeFileSync('/sync-copy-src.txt', 'Copy me');
            const result = fs.copySync('/sync-copy-src.txt', '/sync-copy-dest.txt');
            expect(result.isOk()).toBe(true);

            // Both files should exist
            expect(fs.existsSync('/sync-copy-src.txt').unwrap()).toBe(true);
            expect(fs.existsSync('/sync-copy-dest.txt').unwrap()).toBe(true);

            // Content should be the same
            const content = fs.readTextFileSync('/sync-copy-dest.txt');
            expect(content.unwrap()).toBe('Copy me');
        });

        it('should copy a directory', () => {
            fs.mkdirSync('/sync-copy-dir-src/sub');
            fs.writeFileSync('/sync-copy-dir-src/file.txt', 'root');
            fs.writeFileSync('/sync-copy-dir-src/sub/file.txt', 'sub');

            const result = fs.copySync('/sync-copy-dir-src', '/sync-copy-dir-dest');
            expect(result.isOk()).toBe(true);

            expect(fs.existsSync('/sync-copy-dir-dest/file.txt').unwrap()).toBe(true);
            expect(fs.existsSync('/sync-copy-dir-dest/sub/file.txt').unwrap()).toBe(true);
        });

        it('should not overwrite when overwrite is false', () => {
            fs.writeFileSync('/sync-copy-no-src.txt', 'New');
            fs.writeFileSync('/sync-copy-no-dest.txt', 'Old');

            fs.copySync('/sync-copy-no-src.txt', '/sync-copy-no-dest.txt', { overwrite: false });

            const content = fs.readTextFileSync('/sync-copy-no-dest.txt');
            expect(content.unwrap()).toBe('Old');
        });

        it('should fail when src and dest are different types', () => {
            fs.writeFileSync('/sync-copy-mismatch.txt', 'file');
            fs.mkdirSync('/sync-copy-mismatch-dir');

            const result = fs.copySync('/sync-copy-mismatch.txt', '/sync-copy-mismatch-dir');
            expect(result.isErr()).toBe(true);
        });
    });

    describe('Sync Ext - moveSync', () => {
        afterEach(() => {
            fs.removeSync('/sync-move-src.txt');
            fs.removeSync('/sync-move-dest.txt');
            fs.removeSync('/sync-move-dir-src');
            fs.removeSync('/sync-move-dir-dest');
        });

        it('should move a file', () => {
            fs.writeFileSync('/sync-move-src.txt', 'Move me');
            const result = fs.moveSync('/sync-move-src.txt', '/sync-move-dest.txt');
            expect(result.isOk()).toBe(true);

            expect(fs.existsSync('/sync-move-src.txt').unwrap()).toBe(false);
            expect(fs.existsSync('/sync-move-dest.txt').unwrap()).toBe(true);

            const content = fs.readTextFileSync('/sync-move-dest.txt');
            expect(content.unwrap()).toBe('Move me');
        });

        it('should move a directory', () => {
            fs.mkdirSync('/sync-move-dir-src/sub');
            fs.writeFileSync('/sync-move-dir-src/file.txt', 'root');

            const result = fs.moveSync('/sync-move-dir-src', '/sync-move-dir-dest');
            expect(result.isOk()).toBe(true);

            expect(fs.existsSync('/sync-move-dir-src').unwrap()).toBe(false);
            expect(fs.existsSync('/sync-move-dir-dest/file.txt').unwrap()).toBe(true);
        });
    });

    describe('Sync Ext - emptyDirSync', () => {
        afterEach(() => {
            fs.removeSync('/sync-empty-dir');
            fs.removeSync('/sync-new-empty-dir');
        });

        it('should empty an existing directory', () => {
            fs.mkdirSync('/sync-empty-dir');
            fs.writeFileSync('/sync-empty-dir/file1.txt', 'a');
            fs.writeFileSync('/sync-empty-dir/file2.txt', 'b');

            const result = fs.emptyDirSync('/sync-empty-dir');
            expect(result.isOk()).toBe(true);

            expect(fs.existsSync('/sync-empty-dir', { isDirectory: true }).unwrap()).toBe(true);
            const entries = fs.readDirSync('/sync-empty-dir');
            expect(entries.unwrap().length).toBe(0);
        });

        it('should create directory if not exists', () => {
            const result = fs.emptyDirSync('/sync-new-empty-dir');
            expect(result.isOk()).toBe(true);

            expect(fs.existsSync('/sync-new-empty-dir', { isDirectory: true }).unwrap()).toBe(true);
        });
    });

    describe('Sync Ext - existsSync', () => {
        afterEach(() => {
            fs.removeSync('/sync-exists.txt');
            fs.removeSync('/sync-exists-isfile.txt');
            fs.removeSync('/sync-exists-isfile-dir');
            fs.removeSync('/sync-exists-isdir.txt');
            fs.removeSync('/sync-exists-isdir-dir');
        });

        it('should return true for existing file', () => {
            fs.writeFileSync('/sync-exists.txt', 'content');
            const result = fs.existsSync('/sync-exists.txt');
            expect(result.unwrap()).toBe(true);
        });

        it('should return false for non-existent path', () => {
            const result = fs.existsSync('/sync-not-exists');
            expect(result.unwrap()).toBe(false);
        });

        it('should check isFile option', () => {
            fs.writeFileSync('/sync-exists-isfile.txt', 'content');
            fs.mkdirSync('/sync-exists-isfile-dir');

            expect(fs.existsSync('/sync-exists-isfile.txt', { isFile: true }).unwrap()).toBe(true);
            expect(fs.existsSync('/sync-exists-isfile-dir', { isFile: true }).unwrap()).toBe(false);
        });

        it('should check isDirectory option', () => {
            fs.writeFileSync('/sync-exists-isdir.txt', 'content');
            fs.mkdirSync('/sync-exists-isdir-dir');

            expect(fs.existsSync('/sync-exists-isdir.txt', { isDirectory: true }).unwrap()).toBe(false);
            expect(fs.existsSync('/sync-exists-isdir-dir', { isDirectory: true }).unwrap()).toBe(true);
        });
    });

    describe('Sync Ext - readJsonFileSync & writeJsonFileSync', () => {
        afterEach(() => {
            fs.removeSync('/sync-json.json');
            fs.removeSync('/sync-invalid.json');
        });

        it('should write and read JSON object', () => {
            const data = { name: 'sync-test', value: 456 };

            const writeResult = fs.writeJsonFileSync('/sync-json.json', data);
            expect(writeResult.isOk()).toBe(true);

            const readResult = fs.readJsonFileSync<typeof data>('/sync-json.json');
            expect(readResult.unwrap()).toEqual(data);
        });

        it('should fail to read invalid JSON', () => {
            fs.writeFileSync('/sync-invalid.json', 'not json');

            const result = fs.readJsonFileSync('/sync-invalid.json');
            expect(result.isErr()).toBe(true);
        });
    });

    describe('Sync Zip - zipSync & unzipSync', () => {
        afterEach(() => {
            fs.removeSync('/sync-zip-test');
            fs.removeSync('/sync-test.zip');
            fs.removeSync('/sync-zip-buffer');
            fs.removeSync('/sync-zip-root');
            fs.removeSync('/sync-with-root.zip');
            fs.removeSync('/sync-without-root.zip');
            fs.removeSync('/sync-unzip-src');
            fs.removeSync('/sync-unzip-test.zip');
            fs.removeSync('/sync-unzip-dest');
        });

        it('should zip a directory to file', () => {
            fs.mkdirSync('/sync-zip-test');
            fs.writeFileSync('/sync-zip-test/file1.txt', 'content1');
            fs.writeFileSync('/sync-zip-test/file2.txt', 'content2');

            const result = fs.zipSync('/sync-zip-test', '/sync-test.zip');
            expect(result.isOk()).toBe(true);

            expect(fs.existsSync('/sync-test.zip').unwrap()).toBe(true);
        });

        it('should zip a directory to ArrayBuffer', () => {
            fs.mkdirSync('/sync-zip-buffer');
            fs.writeFileSync('/sync-zip-buffer/file.txt', 'buffer content');

            const result = fs.zipSync('/sync-zip-buffer');
            const buffer = result.unwrap();

            expect(buffer instanceof Uint8Array).toBe(true);
            expect(buffer.byteLength).toBeGreaterThan(0);
        });

        it('should zip with preserveRoot option', () => {
            fs.mkdirSync('/sync-zip-root');
            fs.writeFileSync('/sync-zip-root/file.txt', 'content');

            const zipWithRoot = fs.zipSync('/sync-zip-root', '/sync-with-root.zip');
            expect(zipWithRoot.isOk()).toBe(true);

            const zipWithoutRoot = fs.zipSync('/sync-zip-root', '/sync-without-root.zip', { preserveRoot: false });
            expect(zipWithoutRoot.isOk()).toBe(true);

            // Sizes should be different
            const sizeWith = fs.readFileSync('/sync-with-root.zip').unwrap().byteLength;
            const sizeWithout = fs.readFileSync('/sync-without-root.zip').unwrap().byteLength;
            expect(sizeWith).not.toBe(sizeWithout);
        });

        it('should unzip to a directory', () => {
            // Create and zip a directory
            fs.mkdirSync('/sync-unzip-src');
            fs.writeFileSync('/sync-unzip-src/file1.txt', 'content1');
            fs.writeFileSync('/sync-unzip-src/file2.txt', 'content2');
            fs.zipSync('/sync-unzip-src', '/sync-unzip-test.zip');

            // Unzip
            const result = fs.unzipSync('/sync-unzip-test.zip', '/sync-unzip-dest');
            expect(result.isOk()).toBe(true);

            // Verify extracted contents
            expect(fs.existsSync('/sync-unzip-dest/sync-unzip-src/file1.txt').unwrap()).toBe(true);
            expect(fs.existsSync('/sync-unzip-dest/sync-unzip-src/file2.txt').unwrap()).toBe(true);

            const content = fs.readTextFileSync('/sync-unzip-dest/sync-unzip-src/file1.txt');
            expect(content.unwrap()).toBe('content1');
        });
    });

    describe('Sync Temp - mkTempSync & deleteTempSync', () => {
        afterEach(() => {
            fs.deleteTempSync();
        });

        it('should create temporary file', () => {
            const result = fs.mkTempSync();
            const path = result.unwrap();

            expect(fs.isTempPath(path)).toBe(true);
            expect(fs.existsSync(path).unwrap()).toBe(true);
        });

        it('should create temporary file with custom options', () => {
            const result = fs.mkTempSync({ basename: 'sync-temp', extname: '.txt' });
            const path = result.unwrap();

            expect(path.startsWith('/tmp/sync-temp-')).toBe(true);
            expect(path.endsWith('.txt')).toBe(true);
        });

        it('should create temporary directory', () => {
            const result = fs.mkTempSync({ isDirectory: true });
            const path = result.unwrap();

            expect(fs.isTempPath(path)).toBe(true);
            expect(fs.existsSync(path, { isDirectory: true }).unwrap()).toBe(true);
        });

        it('should delete entire temp directory', () => {
            fs.mkTempSync();
            fs.mkTempSync();

            expect(fs.existsSync(fs.TMP_DIR).unwrap()).toBe(true);

            const result = fs.deleteTempSync();
            expect(result.isOk()).toBe(true);

            expect(fs.existsSync(fs.TMP_DIR).unwrap()).toBe(false);
        });
    });

    describe('Sync - invalid path validation', () => {
        it('should fail createFileSync with relative path', () => {
            const result = fs.createFileSync('relative/path.txt');
            expect(result.isErr()).toBe(true);
            expect(result.unwrapErr().message).toContain('absolute');
        });

        it('should fail mkdirSync with relative path', () => {
            const result = fs.mkdirSync('relative/dir');
            expect(result.isErr()).toBe(true);
            expect(result.unwrapErr().message).toContain('absolute');
        });

        it('should fail writeFileSync with relative path', () => {
            const result = fs.writeFileSync('relative/file.txt', 'content');
            expect(result.isErr()).toBe(true);
            expect(result.unwrapErr().message).toContain('absolute');
        });

        it('should fail readFileSync with relative path', () => {
            const result = fs.readFileSync('relative/file.txt');
            expect(result.isErr()).toBe(true);
            expect(result.unwrapErr().message).toContain('absolute');
        });

        it('should fail readDirSync with relative path', () => {
            const result = fs.readDirSync('relative/dir');
            expect(result.isErr()).toBe(true);
            expect(result.unwrapErr().message).toContain('absolute');
        });

        it('should fail removeSync with relative path', () => {
            const result = fs.removeSync('relative/path');
            expect(result.isErr()).toBe(true);
            expect(result.unwrapErr().message).toContain('absolute');
        });

        it('should fail statSync with relative path', () => {
            const result = fs.statSync('relative/path');
            expect(result.isErr()).toBe(true);
            expect(result.unwrapErr().message).toContain('absolute');
        });

        it('should fail existsSync with relative path', () => {
            const result = fs.existsSync('relative/path');
            expect(result.isErr()).toBe(true);
            expect(result.unwrapErr().message).toContain('absolute');
        });

        it('should fail appendFileSync with relative path', () => {
            const result = fs.appendFileSync('relative/file.txt', 'content');
            expect(result.isErr()).toBe(true);
            expect(result.unwrapErr().message).toContain('absolute');
        });

        it('should fail copySync with relative source path', () => {
            const result = fs.copySync('relative/src', '/dest');
            expect(result.isErr()).toBe(true);
            expect(result.unwrapErr().message).toContain('absolute');
        });

        it('should fail copySync with relative dest path', () => {
            fs.writeFileSync('/valid-copy-src.txt', 'content');
            const result = fs.copySync('/valid-copy-src.txt', 'relative/dest');
            expect(result.isErr()).toBe(true);
            expect(result.unwrapErr().message).toContain('absolute');
            fs.removeSync('/valid-copy-src.txt');
        });

        it('should fail moveSync with relative source path', () => {
            const result = fs.moveSync('relative/src', '/dest');
            expect(result.isErr()).toBe(true);
            expect(result.unwrapErr().message).toContain('absolute');
        });

        it('should fail moveSync with relative dest path', () => {
            fs.writeFileSync('/valid-move-src.txt', 'content');
            const result = fs.moveSync('/valid-move-src.txt', 'relative/dest');
            expect(result.isErr()).toBe(true);
            expect(result.unwrapErr().message).toContain('absolute');
            fs.removeSync('/valid-move-src.txt');
        });

        it('should fail emptyDirSync with relative path', () => {
            const result = fs.emptyDirSync('relative/dir');
            expect(result.isErr()).toBe(true);
            expect(result.unwrapErr().message).toContain('absolute');
        });

        it('should fail unzipSync with relative source path', () => {
            const result = fs.unzipSync('relative/archive.zip', '/dest');
            expect(result.isErr()).toBe(true);
            expect(result.unwrapErr().message).toContain('absolute');
        });

        it('should fail unzipSync with relative dest path', () => {
            fs.mkdirSync('/valid-zip-src');
            fs.writeFileSync('/valid-zip-src/file.txt', 'content');
            fs.zipSync('/valid-zip-src', '/valid.zip');
            const result = fs.unzipSync('/valid.zip', 'relative/dest');
            expect(result.isErr()).toBe(true);
            expect(result.unwrapErr().message).toContain('absolute');
            fs.removeSync('/valid-zip-src');
            fs.removeSync('/valid.zip');
        });

        it('should fail zipSync with relative source path', () => {
            const result = fs.zipSync('relative/source', '/output.zip');
            expect(result.isErr()).toBe(true);
            expect(result.unwrapErr().message).toContain('absolute');
        });

        it('should fail zipSync with relative dest path', () => {
            fs.mkdirSync('/valid-zipsync-src');
            const result = fs.zipSync('/valid-zipsync-src', 'relative/output.zip');
            expect(result.isErr()).toBe(true);
            expect(result.unwrapErr().message).toContain('absolute');
            fs.removeSync('/valid-zipsync-src');
        });

        it('should fail existsSync with conflicting isDirectory and isFile options', () => {
            // @ts-expect-error Testing invalid options
            const result = fs.existsSync('/any-path', { isDirectory: true, isFile: true });
            expect(result.isErr()).toBe(true);
            expect(result.unwrapErr().message).toContain('cannot both be true');
        });

        it('should fail pruneTempSync with invalid Date', () => {
            const invalidDate = new Date('invalid');
            const result = fs.pruneTempSync(invalidDate);
            expect(result.isErr()).toBe(true);
            expect(result.unwrapErr().message).toBe('Expired must be a valid Date');
        });
    });
});
