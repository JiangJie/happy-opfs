/**
 * CLI Benchmark: fflate zip/unzip async vs sync
 *
 * Run: npx tsx benchmarks/cli.ts
 */
import * as fflate from 'fflate';

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

async function benchmarkZipAsync(files: fflate.Zippable, iterations: number): Promise<number> {
    const start = performance.now();

    for (let i = 0; i < iterations; i++) {
        await new Promise<Uint8Array>((resolve, reject) => {
            fflate.zip(files, (err, data) => {
                if (err) reject(err);
                else resolve(data);
            });
        });
    }

    return performance.now() - start;
}

function benchmarkZipSync(files: fflate.Zippable, iterations: number): number {
    const start = performance.now();

    for (let i = 0; i < iterations; i++) {
        fflate.zipSync(files);
    }

    return performance.now() - start;
}

async function benchmarkUnzipAsync(zipData: Uint8Array, iterations: number): Promise<number> {
    const start = performance.now();

    for (let i = 0; i < iterations; i++) {
        await new Promise<fflate.Unzipped>((resolve, reject) => {
            fflate.unzip(zipData, (err, data) => {
                if (err) reject(err);
                else resolve(data);
            });
        });
    }

    return performance.now() - start;
}

function benchmarkUnzipSync(zipData: Uint8Array, iterations: number): number {
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
    const files = createTestFiles(fileCount, fileSizeKB);
    const totalSize = fileCount * fileSizeKB;

    console.log(`\n${name}`);
    console.log(`Total uncompressed: ${totalSize} KB`);

    // Zip benchmark
    const zipAsyncTime = await benchmarkZipAsync(files, iterations);
    const zipSyncTime = benchmarkZipSync(files, iterations);

    console.log(`\n  zip:`);
    console.log(`    Async: ${(zipAsyncTime / iterations).toFixed(2)} ms/op`);
    console.log(`    Sync:  ${(zipSyncTime / iterations).toFixed(2)} ms/op`);
    console.log(`    Ratio: ${(zipAsyncTime / zipSyncTime).toFixed(2)}x (${zipAsyncTime < zipSyncTime ? 'async faster' : 'sync faster'})`);

    // Create zip data for unzip benchmark
    const zipData = fflate.zipSync(files);
    console.log(`  Zip size: ${(zipData.byteLength / 1024).toFixed(2)} KB`);

    // Unzip benchmark
    const unzipAsyncTime = await benchmarkUnzipAsync(zipData, iterations);
    const unzipSyncTime = benchmarkUnzipSync(zipData, iterations);

    console.log(`\n  unzip:`);
    console.log(`    Async: ${(unzipAsyncTime / iterations).toFixed(2)} ms/op`);
    console.log(`    Sync:  ${(unzipSyncTime / iterations).toFixed(2)} ms/op`);
    console.log(`    Ratio: ${(unzipAsyncTime / unzipSyncTime).toFixed(2)}x (${unzipAsyncTime < unzipSyncTime ? 'async faster' : 'sync faster'})`);
}

async function main(): Promise<void> {
    console.log('=== fflate zip/unzip async vs sync benchmark ===');

    const benchmarks: BenchmarkConfig[] = [
        { name: 'Small (10 files x 10KB)', fileCount: 10, fileSizeKB: 10, iterations: 50 },
        { name: 'Medium (50 files x 100KB)', fileCount: 50, fileSizeKB: 100, iterations: 10 },
        { name: 'Large (10 files x 1MB)', fileCount: 10, fileSizeKB: 1024, iterations: 5 },
    ];

    for (const config of benchmarks) {
        await runBenchmark(config);
    }

    console.log('\n=== Benchmark Complete ===');
}

main().catch(console.error);
