/**
 * Benchmark: fflate.unzip vs fflate.unzipSync
 *
 * This benchmark compares the performance of async and sync unzip operations
 * to determine if using unzipSync in Worker context is beneficial.
 *
 * Run: pnpm run bench
 *
 * Results (2025-01):
 * | Scenario                  | Zip Size  | Async     | Sync      | Ratio |
 * |---------------------------|-----------|-----------|-----------|-------|
 * | Small (10 files x 10KB)   | 4.34 KB   | 0.49 ms   | 0.46 ms   | 1.06x |
 * | Medium (50 files x 100KB) | 39.70 KB  | 17.55 ms  | 18.22 ms  | 0.96x |
 * | Large (10 files x 1MB)    | 43.77 KB  | 30.42 ms  | 41.52 ms  | 0.73x |
 *
 * Conclusion: Async is faster for larger files, no benefit to using unzipSync.
 */
import * as fflate from 'fflate/browser';
import { Future } from 'tiny-future';

const output = document.getElementById('output')!;

function log(message: string): void {
    const line = document.createElement('div');
    line.textContent = message;
    output.appendChild(line);
    console.log(message);
}

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

async function benchmarkAsync(zipData: Uint8Array, iterations: number): Promise<number> {
    const start = performance.now();

    for (let i = 0; i < iterations; i++) {
        const future = new Future<void>();
        fflate.unzip(zipData, (err) => {
            if (err) throw err;
            future.resolve();
        });
        await future.promise;
    }

    return performance.now() - start;
}

function benchmarkSync(zipData: Uint8Array, iterations: number): number {
    const start = performance.now();

    for (let i = 0; i < iterations; i++) {
        fflate.unzipSync(zipData);
    }

    return performance.now() - start;
}

interface BenchmarkConfig {
    name: string;
    fileCount: number;
    fileSizeKB: number;
    iterations: number;
}

async function runBenchmark(config: BenchmarkConfig): Promise<void> {
    const { name, fileCount, fileSizeKB, iterations } = config;
    const zipData = createTestZip(fileCount, fileSizeKB);

    log(`\n${name}`);
    log(`Zip size: ${(zipData.byteLength / 1024).toFixed(2)} KB`);

    const asyncTime = await benchmarkAsync(zipData, iterations);
    const syncTime = benchmarkSync(zipData, iterations);

    log(`Async: ${(asyncTime / iterations).toFixed(2)} ms/op`);
    log(`Sync:  ${(syncTime / iterations).toFixed(2)} ms/op`);
    log(`Ratio: ${(asyncTime / syncTime).toFixed(2)}x (${asyncTime < syncTime ? 'async faster' : 'sync faster'})`);
}

async function runAllBenchmarks(): Promise<void> {
    output.textContent = '';
    log('=== fflate unzip vs unzipSync benchmark ===');

    const benchmarks: BenchmarkConfig[] = [
        { name: 'Small (10 files x 10KB)', fileCount: 10, fileSizeKB: 10, iterations: 50 },
        { name: 'Medium (50 files x 100KB)', fileCount: 50, fileSizeKB: 100, iterations: 10 },
        { name: 'Large (10 files x 1MB)', fileCount: 10, fileSizeKB: 1024, iterations: 5 },
    ];

    for (const config of benchmarks) {
        await runBenchmark(config);
    }

    log('\n=== Benchmark Complete ===');
}

document.getElementById('run')!.addEventListener('click', () => {
    runAllBenchmarks().catch((err) => {
        log(`Error: ${err.message}`);
    });
});
