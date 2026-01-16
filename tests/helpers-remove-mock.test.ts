/**
 * Test for helpers.ts removeHandle fallback logic.
 * Covers lines 256-268: Firefox/Safari fallback when handle.remove() is not available.
 * 
 * Uses direct import and mock handles to test the fallback paths.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { removeHandle } from '../src/async/internal/helpers.ts';
import * as fs from '../src/mod.ts';

describe('helpers.ts removeHandle fallback', () => {
    beforeEach(async () => {
        // Clean up before each test
        await fs.remove('/test-fallback');
    });

    afterEach(async () => {
        await fs.remove('/test-fallback');
    });

    it('should use removeEntry fallback for non-root when handle.remove() is not available (line 268)', async () => {
        // Create test directory and file
        await fs.mkdir('/test-fallback');
        await fs.writeFile('/test-fallback/file.txt', 'content');

        // Get the parent directory handle
        const rootHandle = await navigator.storage.getDirectory();
        const parentDirHandle = await rootHandle.getDirectoryHandle('test-fallback');
        const fileHandle = await parentDirHandle.getFileHandle('file.txt');

        // Create a mock handle without remove() method (simulating Firefox/Safari)
        const mockHandle = {
            kind: fileHandle.kind,
            name: fileHandle.name,
            isSameEntry: fileHandle.isSameEntry.bind(fileHandle),
            // No remove() method - this triggers line 268 fallback
        } as FileSystemFileHandle;

        // Call removeHandle directly with mock handle
        await removeHandle(mockHandle, parentDirHandle, { recursive: true });

        // Verify file is removed
        expect((await fs.exists('/test-fallback/file.txt')).unwrap()).toBe(false);
    });

    it('should iterate and remove children for root directory when handle.remove() is not available (lines 256-266)', async () => {
        // Create files in a test directory (simulating root behavior)
        await fs.mkdir('/test-fallback');
        await fs.writeFile('/test-fallback/file1.txt', 'content1');
        await fs.writeFile('/test-fallback/file2.txt', 'content2');
        await fs.mkdir('/test-fallback/subdir');

        // Get the directory handle
        const rootHandle = await navigator.storage.getDirectory();
        const dirHandle = await rootHandle.getDirectoryHandle('test-fallback');

        // Create a mock handle without remove() method AND with empty name (simulating root)
        const mockRootHandle = {
            kind: 'directory' as const,
            name: '', // Empty name like root directory
            isSameEntry: dirHandle.isSameEntry.bind(dirHandle),
            keys: dirHandle.keys.bind(dirHandle),
            removeEntry: dirHandle.removeEntry.bind(dirHandle),
            // No remove() method - this triggers lines 256-266 fallback
        } as FileSystemDirectoryHandle;

        // Call removeHandle directly with mock root handle
        await removeHandle(mockRootHandle, dirHandle, { recursive: true });

        // Verify all children are removed
        const entries: string[] = [];
        for await (const name of dirHandle.keys()) {
            entries.push(name);
        }
        expect(entries.length).toBe(0);
    });

    it('should handle empty directory in root fallback path (line 264 false branch)', async () => {
        // Create empty test directory
        await fs.mkdir('/test-fallback');

        // Get the directory handle
        const rootHandle = await navigator.storage.getDirectory();
        const dirHandle = await rootHandle.getDirectoryHandle('test-fallback');

        // Create a mock handle without remove() method AND with empty name
        const mockRootHandle = {
            kind: 'directory' as const,
            name: '', // Empty name like root directory
            isSameEntry: dirHandle.isSameEntry.bind(dirHandle),
            keys: dirHandle.keys.bind(dirHandle),
            removeEntry: dirHandle.removeEntry.bind(dirHandle),
            // No remove() method
        } as FileSystemDirectoryHandle;

        // Call removeHandle directly - directory is empty so tasks.length === 0
        await removeHandle(mockRootHandle, dirHandle, { recursive: true });

        // Should complete without error
        expect(true).toBe(true);
    });
});
