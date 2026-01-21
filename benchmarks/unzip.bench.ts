/**
 * Benchmark: fflate.unzip vs fflate.unzipSync
 *
 * This benchmark compares the performance of async and sync unzip operations
 * to determine if using unzipSync in Worker context is beneficial.
 *
 * Run: pnpm run bench:vitest
 *
 * Results (2026-01):
 * | Scenario                  | Async (hz) | Sync (hz) | Winner      | Ratio  |
 * |---------------------------|------------|-----------|-------------|--------|
 * | Small (10 files x 10KB)   | 1859.24    | 1904.27   | unzipSync   | 1.02x  |
 * | Medium (50 files x 100KB) | 45.04      | 46.53     | unzipSync   | 1.03x  |
 * | Large (10 files x 1MB)    | 36.30      | 23.95     | unzip async | 1.52x  |
 *
 * Conclusion: For large files, async unzip is faster (1.52x).
 * For small/medium files, sync is slightly faster but difference is minimal.
 */
import * as fflate from 'fflate/browser';
import { Future } from 'tiny-future';
import { bench, describe } from 'vitest';

/**
 * Create test zip data with specified number of files and size.
 */
function createTestZip(fileCount: number, fileSizeKB: number): Uint8Array {
    const files: fflate.Zippable = {};
    const content = new Uint8Array(fileSizeKB * 1024);
    // Fill with random-ish data to prevent extreme compression
    for (let i = 0; i < content.length; i++) {
        content[i] = (i * 17 + 13) % 256;
    }

    for (let i = 0; i < fileCount; i++) {
        files[`file${i}.bin`] = content;
    }

    return fflate.zipSync(files);
}

describe('fflate unzip vs unzipSync - Small (10 files x 10KB)', () => {
    const zipData = createTestZip(10, 10);

    bench('unzip (async)', async () => {
        const future = new Future<fflate.Unzipped>();
        fflate.unzip(zipData, (err, data) => {
            if (err) {
                future.reject(err);
            } else {
                future.resolve(data);
            }
        });
        await future.promise;
    });

    bench('unzipSync', () => {
        fflate.unzipSync(zipData);
    });
});

describe('fflate unzip vs unzipSync - Medium (50 files x 100KB)', () => {
    const zipData = createTestZip(50, 100);

    bench('unzip (async)', async () => {
        const future = new Future<fflate.Unzipped>();
        fflate.unzip(zipData, (err, data) => {
            if (err) {
                future.reject(err);
            } else {
                future.resolve(data);
            }
        });
        await future.promise;
    });

    bench('unzipSync', () => {
        fflate.unzipSync(zipData);
    });
});

describe('fflate unzip vs unzipSync - Large (10 files x 1MB)', () => {
    const zipData = createTestZip(10, 1024);

    bench('unzip (async)', async () => {
        const future = new Future<fflate.Unzipped>();
        fflate.unzip(zipData, (err, data) => {
            if (err) {
                future.reject(err);
            } else {
                future.resolve(data);
            }
        });
        await future.promise;
    });

    bench('unzipSync', () => {
        fflate.unzipSync(zipData);
    });
});
