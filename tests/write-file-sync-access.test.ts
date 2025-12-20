/**
 * Tests for writeFile function's NoStrategyError branch (line 341-344)
 *
 * This test covers the edge case when neither createWritable nor
 * createSyncAccessHandle is available.
 *
 * Note: The createSyncAccessHandle branch (line 306-340) can only be tested
 * in a dedicated Worker context, as createSyncAccessHandle is not available
 * in the main thread. The sync API tests (write-file-sync.test.ts) indirectly
 * test this path through the Worker.
 */
import { afterAll, describe, expect, it } from 'vitest';
import * as fs from '../src/mod.ts';

describe('writeFile - NoStrategyError branch (line 341-344)', () => {
    let originalCreateWritable: typeof FileSystemFileHandle.prototype.createWritable | undefined;
    let originalCreateSyncAccessHandle: typeof FileSystemFileHandle.prototype.createSyncAccessHandle | undefined;

    afterAll(async () => {
        // Restore methods
        if (originalCreateWritable) {
            FileSystemFileHandle.prototype.createWritable = originalCreateWritable;
        }
        if (originalCreateSyncAccessHandle) {
            FileSystemFileHandle.prototype.createSyncAccessHandle = originalCreateSyncAccessHandle;
        }
        await fs.remove('/no-strategy-test.txt');
    });

    it('should return NoStrategyError when no write strategy is available', async () => {
        // Save original methods
        originalCreateWritable = FileSystemFileHandle.prototype.createWritable;
        originalCreateSyncAccessHandle = FileSystemFileHandle.prototype.createSyncAccessHandle;

        // Remove both write methods to simulate an environment with no write strategy
        // @ts-expect-error - intentionally removing method for testing
        delete FileSystemFileHandle.prototype.createWritable;
        // @ts-expect-error - intentionally removing method for testing
        delete FileSystemFileHandle.prototype.createSyncAccessHandle;

        const result = await fs.writeFile('/no-strategy-test.txt', 'content');
        expect(result.isErr()).toBe(true);

        const error = result.unwrapErr();
        expect(error.name).toBe('NoStrategyError');
        expect(error.message).toBe('No file write strategy available');

        // Restore methods immediately
        if (originalCreateWritable) {
            FileSystemFileHandle.prototype.createWritable = originalCreateWritable;
        }
        if (originalCreateSyncAccessHandle) {
            FileSystemFileHandle.prototype.createSyncAccessHandle = originalCreateSyncAccessHandle;
        }
    });
});
