/**
 * Tests for the `workerType` option of SyncChannel.connect.
 *
 * Runs with the `00-` prefix for its own browser context: it connects and
 * releases channels, which must not leak into other test files.
 */
import { describe, expect, it } from 'vite-plus/test';
import { existsSync, SyncChannel } from '../src/mod.ts';

const workerUrl = new URL('./worker.ts', import.meta.url);
const connectOptions = { sharedBufferLength: 1024 * 1024, opTimeout: 5000 };

describe('SyncChannel.connect workerType', () => {
    it('should load a module worker when workerType is module', async () => {
        const result = await SyncChannel.connect(workerUrl, {
            ...connectOptions,
            workerType: 'module',
        });
        expect(result.isOk()).toBe(true);
        expect(SyncChannel.isReady()).toBe(true);

        // The channel loaded from the URL really works
        expect(existsSync('/worker-type-probe').isOk()).toBe(true);

        expect(SyncChannel.disconnect().isOk()).toBe(true);
    });

    it('should default to a classic worker', async () => {
        // worker.ts is an ES module, so classic loading fails and the failed
        // worker surfaces as an Err instead of a hanging connection
        const result = await SyncChannel.connect(workerUrl, connectOptions);
        expect(result.isErr()).toBe(true);
        expect(SyncChannel.isReady()).toBe(false);
    });
});
