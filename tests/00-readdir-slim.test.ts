/**
 * Tests for listing a large directory through a small SharedArrayBuffer.
 *
 * A response that does not fit the buffer comes back as a RangeError, so listing a
 * big tree only works when the entries stay small - which is what `withMetadata:
 * false` trades metadata for. Runs with the `00-` prefix so it gets its own browser
 * context: it connects to a small channel that must not leak into other test files.
 */
import { describe, expect, it } from 'vite-plus/test';
import { readDirSync, removeSync, SyncChannel, writeFile } from '../src/mod.ts';

const DIR_PATH = '/readdir-slim';
const FILE_COUNT = 1000;
const WRITE_BATCH = 200;

// Sized between the two responses (measured): 1000 entries serialize to ~35KB
// without metadata and ~123KB with it, so only the metadata listing overflows.
const BUFFER_LENGTH = 64 * 1024;

describe('readDirSync - large listing', () => {
    it('should list a large directory without metadata but not with it', async () => {
        // Skip if already ready (this test needs its own channel)
        if (SyncChannel.isReady()) {
            console.warn('Skipping large listing test: sync channel already ready');
            return;
        }

        const worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });

        try {
            const connectRes = await SyncChannel.connect(worker, {
                sharedBufferLength: BUFFER_LENGTH,
                opTimeout: 5000,
            });
            expect(connectRes.isOk()).toBe(true);

            const names = Array.from(
                { length: FILE_COUNT },
                (_, index) => `f${String(index).padStart(4, '0')}.txt`,
            );
            // Created through the async API: the fixture does not need the sync
            // channel, and batched writes keep the setup fast
            for (let start = 0; start < names.length; start += WRITE_BATCH) {
                const batchRes = await Promise.all(
                    names
                        .slice(start, start + WRITE_BATCH)
                        .map(name => writeFile(`${DIR_PATH}/${name}`, 'x')),
                );
                expect(batchRes.every(res => res.isOk())).toBe(true);
            }

            // Entries carry only `path` and `kind`, so the whole listing fits
            const slimRes = readDirSync(DIR_PATH, { withMetadata: false });
            expect(slimRes.isOk()).toBe(true);

            const slimEntries = slimRes.unwrap();
            expect(slimEntries.length).toBe(FILE_COUNT);
            expect(slimEntries.map(entry => entry.path).toSorted()).toEqual(names.toSorted());
            expect(slimEntries.every(entry => entry.kind === 'file')).toBe(true);

            // The very same listing with metadata cannot fit the same buffer - the
            // failure that `withMetadata: false` exists to avoid
            const fullRes = readDirSync(DIR_PATH);
            expect(fullRes.isErr()).toBe(true);
            expect(fullRes.unwrapErr().name).toBe('RangeError');
        } finally {
            removeSync(DIR_PATH);
            SyncChannel.disconnect();
            worker.terminate();
        }
    });
});
