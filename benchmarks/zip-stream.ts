/**
 * Benchmark: Batch zip vs Streaming zip
 *
 * This benchmark compares the performance of:
 * - Batch: fflate.zip - compress all files at once, get complete bytes
 * - Stream: fflate.Zip - stream compressed data as it's generated
 *
 * Run: pnpm run bench, then open zip-stream.html
 */
import { zip as compress, Zip, ZipDeflate, ZipPassThrough, type Zippable } from 'fflate/browser';
import { Future } from 'tiny-future';

const output = document.getElementById('output')!;

function log(message: string): void {
    const line = document.createElement('div');
    line.textContent = message;
    output.appendChild(line);
    console.log(message);
}

function createTestFiles(fileCount: number, fileSizeKB: number): Zippable {
    const files: Zippable = {};
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

/**
 * Batch zip - compress all files at once
 */
async function benchmarkBatch(files: Zippable, iterations: number): Promise<{ time: number; outputSize: number; }> {
    let outputSize = 0;
    const start = performance.now();

    for (let i = 0; i < iterations; i++) {
        const future = new Future<Uint8Array>();
        compress(files, { consume: false }, (err, data) => {
            if (err) throw err;
            future.resolve(data);
        });
        const result = await future.promise;
        outputSize = result.byteLength;
    }

    return { time: performance.now() - start, outputSize };
}

/**
 * Streaming zip - stream compressed data as it's generated
 */
async function benchmarkStream(files: Zippable, iterations: number): Promise<{ time: number; outputSize: number; }> {
    let outputSize = 0;
    const start = performance.now();

    for (let i = 0; i < iterations; i++) {
        outputSize = await streamZip(files);
    }

    return { time: performance.now() - start, outputSize };
}

/**
 * Perform streaming zip on files
 */
function streamZip(files: Zippable): Promise<number> {
    return new Promise((resolve, reject) => {
        const chunks: Uint8Array[] = [];

        const zip = new Zip((err, chunk, final) => {
            if (err) {
                reject(err);
                return;
            }

            chunks.push(chunk);

            if (final) {
                const totalSize = chunks.reduce((sum, c) => sum + c.byteLength, 0);
                resolve(totalSize);
            }
        });

        try {
            for (const [name, data] of Object.entries(files)) {
                const entry = new ZipDeflate(name, { level: 6 });
                zip.add(entry);
                entry.push(data as Uint8Array, true);
            }
            zip.end();
        } catch (err) {
            reject(err);
        }
    });
}

/**
 * Streaming zip with ZipPassThrough (no compression)
 */
async function benchmarkStreamNoCompression(files: Zippable, iterations: number): Promise<{ time: number; outputSize: number; }> {
    let outputSize = 0;
    const start = performance.now();

    for (let i = 0; i < iterations; i++) {
        outputSize = await streamZipNoCompression(files);
    }

    return { time: performance.now() - start, outputSize };
}

function streamZipNoCompression(files: Zippable): Promise<number> {
    return new Promise((resolve, reject) => {
        const chunks: Uint8Array[] = [];

        const zip = new Zip((err, chunk, final) => {
            if (err) {
                reject(err);
                return;
            }

            chunks.push(chunk);

            if (final) {
                const totalSize = chunks.reduce((sum, c) => sum + c.byteLength, 0);
                resolve(totalSize);
            }
        });

        try {
            for (const [name, data] of Object.entries(files)) {
                const entry = new ZipPassThrough(name);
                zip.add(entry);
                entry.push(data as Uint8Array, true);
            }
            zip.end();
        } catch (err) {
            reject(err);
        }
    });
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
    const uncompressedSize = fileCount * fileSizeKB;

    log(`\n${name}`);
    log(`Uncompressed: ${uncompressedSize} KB (${fileCount} files x ${fileSizeKB} KB)`);

    // Warm up
    await benchmarkBatch(files, 1);
    await benchmarkStream(files, 1);
    await benchmarkStreamNoCompression(files, 1);

    const batchResult = await benchmarkBatch(files, iterations);
    const streamResult = await benchmarkStream(files, iterations);
    const streamNoCompResult = await benchmarkStreamNoCompression(files, iterations);

    const batchAvg = batchResult.time / iterations;
    const streamAvg = streamResult.time / iterations;
    const streamNoCompAvg = streamNoCompResult.time / iterations;

    log(`Compressed size: ${(batchResult.outputSize / 1024).toFixed(2)} KB`);
    log(`Batch (zip):           ${batchAvg.toFixed(2)} ms/op`);
    log(`Stream (Zip+Deflate):  ${streamAvg.toFixed(2)} ms/op (${(streamAvg / batchAvg).toFixed(2)}x)`);
    log(`Stream (Zip+Pass):     ${streamNoCompAvg.toFixed(2)} ms/op (${(streamNoCompAvg / batchAvg).toFixed(2)}x)`);
}

async function runAllBenchmarks(): Promise<void> {
    output.textContent = '';
    log('=== Batch vs Streaming Zip Benchmark ===');
    log('Measuring pure compression overhead (no actual file I/O)');

    const benchmarks: BenchmarkConfig[] = [
        { name: 'Small (10 files x 10KB = 100KB)', fileCount: 10, fileSizeKB: 10, iterations: 50 },
        { name: 'Medium (50 files x 100KB = 5MB)', fileCount: 50, fileSizeKB: 100, iterations: 10 },
        { name: 'Large (10 files x 1MB = 10MB)', fileCount: 10, fileSizeKB: 1024, iterations: 5 },
        { name: 'XLarge (100 files x 1MB = 100MB)', fileCount: 100, fileSizeKB: 1024, iterations: 2 },
    ];

    for (const config of benchmarks) {
        await runBenchmark(config);
    }

    log('\n=== Benchmark Complete ===');
    log('\nNote: Stream mode enables incremental output for reduced memory.');
    log('The overhead is minimal when writing to file via ReadableStream.');
}

document.getElementById('run')!.addEventListener('click', () => {
    runAllBenchmarks().catch((err) => {
        log(`Error: ${err.message}`);
    });
});
