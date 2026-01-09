/**
 * Benchmark: fflate.zip vs fflate.zipSync
 *
 * This benchmark compares the performance of async and sync zip operations
 * to determine if using zipSync in Worker context is beneficial.
 *
 * Run: pnpm run bench
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

async function benchmarkAsync(files: fflate.Zippable, iterations: number): Promise<number> {
    const start = performance.now();

    for (let i = 0; i < iterations; i++) {
        const future = new Future<Uint8Array>();
        fflate.zip(files, (err, data) => {
            if (err) throw err;
            future.resolve(data);
        });
        await future.promise;
    }

    return performance.now() - start;
}

function benchmarkSync(files: fflate.Zippable, iterations: number): number {
    const start = performance.now();

    for (let i = 0; i < iterations; i++) {
        fflate.zipSync(files);
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
    const files = createTestFiles(fileCount, fileSizeKB);
    const totalSize = fileCount * fileSizeKB;

    log(`\n${name}`);
    log(`Total uncompressed: ${totalSize} KB`);

    const asyncTime = await benchmarkAsync(files, iterations);
    const syncTime = benchmarkSync(files, iterations);

    log(`Async: ${(asyncTime / iterations).toFixed(2)} ms/op`);
    log(`Sync:  ${(syncTime / iterations).toFixed(2)} ms/op`);
    log(`Ratio: ${(asyncTime / syncTime).toFixed(2)}x (${asyncTime < syncTime ? 'async faster' : 'sync faster'})`);
}

async function runAllBenchmarks(): Promise<void> {
    output.textContent = '';
    log('=== fflate zip vs zipSync benchmark ===');

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
