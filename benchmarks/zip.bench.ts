/**
 * Benchmark: fflate.zip vs fflate.zipSync
 *
 * This benchmark compares the performance of async and sync zip operations
 * to determine if using zipSync in Worker context is beneficial.
 *
 * Run: pnpm run bench:vitest
 *
 * Results (2026-01):
 * | Scenario                  | Async (hz) | Sync (hz) | Winner    | Ratio  |
 * |---------------------------|------------|-----------|-----------|--------|
 * | Small (10 files x 10KB)   | 487.40     | 497.33    | zipSync   | 1.02x  |
 * | Medium (50 files x 100KB) | 14.23      | 14.29     | zipSync   | 1.00x  |
 * | Large (10 files x 1MB)    | 11.52      | 4.90      | zip async | 2.35x  |
 *
 * Conclusion: For large files, async zip is significantly faster (2.35x).
 * For small/medium files, performance is similar.
 */
import * as fflate from 'fflate/browser';
import { Future } from 'tiny-future';
import { bench, describe } from 'vitest';

function createTestFiles(fileCount: number, fileSizeKB: number): fflate.Zippable {
    const files: fflate.Zippable = {};
    const content = new Uint8Array(fileSizeKB * 1024);
    // Fill with random-ish data to prevent extreme compression
    for (let i = 0; i < content.length; i++) {
        content[i] = (i * 17 + 13) % 256;
    }

    for (let i = 0; i < fileCount; i++) {
        files[`file${i}.bin`] = content;
    }

    return files;
}

describe('Small (10 files x 10KB)', () => {
    const files = createTestFiles(10, 10);

    bench('zip (async)', async () => {
        const future = new Future<Uint8Array>();
        fflate.zip(files, (err, data) => {
            if (err) throw err;
            future.resolve(data);
        });
        await future.promise;
    });

    bench('zipSync', () => {
        fflate.zipSync(files);
    });
});

describe('Medium (50 files x 100KB)', () => {
    const files = createTestFiles(50, 100);

    bench('zip (async)', async () => {
        const future = new Future<Uint8Array>();
        fflate.zip(files, (err, data) => {
            if (err) throw err;
            future.resolve(data);
        });
        await future.promise;
    });

    bench('zipSync', () => {
        fflate.zipSync(files);
    });
});

describe('Large (10 files x 1MB)', () => {
    const files = createTestFiles(10, 1024);

    bench('zip (async)', async () => {
        const future = new Future<Uint8Array>();
        fflate.zip(files, (err, data) => {
            if (err) throw err;
            future.resolve(data);
        });
        await future.promise;
    });

    bench('zipSync', () => {
        fflate.zipSync(files);
    });
});
