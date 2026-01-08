/**
 * Tests for sync operation timeout behavior.
 * Uses opTimeout: 0 to trigger immediate timeout.
 */
import { describe, expect, it } from 'vitest';
import { connectSyncAgent, existsSync, isSyncAgentConnected, TIMEOUT_ERROR } from '../src/mod.ts';

describe('Sync Operation Timeout', () => {
    it('should return TimeoutError when opTimeout is 0', async () => {
        // Skip if already connected (this test needs isolated context)
        if (isSyncAgentConnected()) {
            console.warn('Skipping timeout test: sync agent already connected');
            return;
        }

        // Connect with opTimeout: 0 to trigger immediate timeout
        await connectSyncAgent({
            worker: new Worker(new URL('./worker.ts', import.meta.url), {
                type: 'module',
            }),
            opTimeout: 1, // Use 1ms instead of 0 to pass validation (must be > 0)
        });

        // Any sync operation should timeout immediately
        const result = existsSync('/any-path');
        expect(result.isErr()).toBe(true);
        expect(result.unwrapErr().name).toBe(TIMEOUT_ERROR);
    });
});
