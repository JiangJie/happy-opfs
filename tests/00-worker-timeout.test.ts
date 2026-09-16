/**
 * Tests for sync operation timeout behavior.
 * Connects with a tiny opTimeout (1ms) so that calls hit the timeout path.
 */
import { describe, expect, it } from 'vite-plus/test';
import { existsSync, removeSync, SyncChannel, TIMEOUT_ERROR, writeFileSync } from '../src/mod.ts';

const SLOW_FILE = '/timeout-slow.bin';
const BUFFER_LENGTH = 40 * 1024 * 1024;

/**
 * Writing 32MB takes far longer than the 1ms opTimeout, leaving a wide margin:
 * the worker is still writing when the next call arrives, and still busy a few
 * milliseconds later when the channel tries to drain the pending response.
 */
const SLOW_CONTENT = new Uint8Array(32 * 1024 * 1024);

describe('Sync Operation Timeout', () => {
    let sharedBuffer: SharedArrayBuffer | undefined;

    it('should return TimeoutError when opTimeout is 0', async () => {
        // Skip if already ready (this test needs isolated context)
        if (SyncChannel.isReady()) {
            console.warn('Skipping timeout test: sync channel already ready');
            return;
        }

        // Connect with opTimeout: 0 to trigger immediate timeout
        const connectRes = await SyncChannel.connect(
            new Worker(new URL('./worker.ts', import.meta.url), {
                type: 'module',
            }),
            { sharedBufferLength: BUFFER_LENGTH, opTimeout: 1 }, // Use 1ms instead of 0 to pass validation (must be > 0)
        );
        expect(connectRes.isOk()).toBe(true);
        sharedBuffer = connectRes.unwrap();

        // Any sync operation should timeout immediately
        const result = existsSync('/any-path');
        expect(result.isErr()).toBe(true);
        expect(result.unwrapErr().name).toBe(TIMEOUT_ERROR);
    });

    it('should not deliver a stale response to a later operation', async () => {
        if (!SyncChannel.isReady() || !sharedBuffer) {
            console.warn('Skipping stale response test: sync channel not connected');
            return;
        }

        // The previous test left a timed-out call in flight, so a 1ms budget would
        // make the pre-request drain race the worker waking up - and a drain timeout
        // drops the request instead of sending it. Drain with a generous budget
        // first: the call below queues behind nothing, proves SLOW_FILE is absent
        // (which keeps the final `true` assertion meaningful), and leaves the channel
        // idle, so the slow write is guaranteed to be sent.
        SyncChannel.attach(sharedBuffer, { opTimeout: 5000 });
        removeSync(SLOW_FILE);
        expect(existsSync(SLOW_FILE).unwrap()).toBe(false);

        // Times out while the worker keeps writing the file
        SyncChannel.attach(sharedBuffer, { opTimeout: 1 });
        const slowRes = writeFileSync(SLOW_FILE, SLOW_CONTENT);
        expect(slowRes.isErr()).toBe(true);
        expect(slowRes.unwrapErr().name).toBe(TIMEOUT_ERROR);

        // Sent while that write is still in flight: it must fail with its own
        // timeout instead of being handed the pending write's response
        const busyRes = existsSync(SLOW_FILE);
        expect(busyRes.isErr()).toBe(true);
        expect(busyRes.unwrapErr().name).toBe(TIMEOUT_ERROR);

        // With enough budget the pending write finishes, the channel drains it and
        // this call gets its own answer - not the write's response, which would
        // surface here as Ok(null). The file existing also proves the slow write
        // was actually sent, not dropped by a drain timeout.
        SyncChannel.attach(sharedBuffer, { opTimeout: 5000 });

        const existsRes = existsSync(SLOW_FILE);
        expect(existsRes.isOk()).toBe(true);
        expect(existsRes.unwrap()).toBe(true);

        // Clean up through the (now recovered) channel
        expect(removeSync(SLOW_FILE).isOk()).toBe(true);
    });
});
