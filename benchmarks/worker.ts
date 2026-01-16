/**
 * Worker benchmark: fflate zip/unzip async vs sync inside Worker
 *
 * This tests whether async (sub-workers) provides benefit when already in a Worker.
 */
import * as fflate from 'fflate/browser';

interface BenchmarkResult {
    name: string;
    zipAsync: number;
    zipSync: number;
    unzipAsync: number;
    unzipSync: number;
    zipSize: number;
}

function createTestFiles(fileCount: number, fileSizeKB: number): fflate.Zippable {
    const files: fflate.Zippable = {};
    const content = new Uint8Array(fileSizeKB * 1024);
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

async function runBenchmark(config: BenchmarkConfig): Promise<BenchmarkResult> {
    const { name, fileCount, fileSizeKB, iterations } = config;
    const files = createTestFiles(fileCount, fileSizeKB);

    const zipAsyncTime = await benchmarkZipAsync(files, iterations);
    const zipSyncTime = benchmarkZipSync(files, iterations);

    const zipData = fflate.zipSync(files);

    const unzipAsyncTime = await benchmarkUnzipAsync(zipData, iterations);
    const unzipSyncTime = benchmarkUnzipSync(zipData, iterations);

    return {
        name,
        zipAsync: zipAsyncTime / iterations,
        zipSync: zipSyncTime / iterations,
        unzipAsync: unzipAsyncTime / iterations,
        unzipSync: unzipSyncTime / iterations,
        zipSize: zipData.byteLength,
    };
}

async function runAllBenchmarks(): Promise<BenchmarkResult[]> {
    const benchmarks: BenchmarkConfig[] = [
        { name: 'Small (10 files x 10KB)', fileCount: 10, fileSizeKB: 10, iterations: 20 },
        { name: 'Medium (50 files x 100KB)', fileCount: 50, fileSizeKB: 100, iterations: 5 },
        { name: 'Large (10 files x 1MB)', fileCount: 10, fileSizeKB: 1024, iterations: 3 },
    ];

    const results: BenchmarkResult[] = [];
    for (const config of benchmarks) {
        results.push(await runBenchmark(config));
    }

    return results;
}

// Worker message handler
self.onmessage = async () => {
    const results = await runAllBenchmarks();
    self.postMessage(results);
};
