/**
 * Benchmark: Batch unzip vs Streaming unzip
 *
 * This benchmark compares the performance of:
 * - Batch: Load entire zip into memory, then decompress all at once
 * - Stream: Stream zip data and decompress incrementally
 *
 * Run: pnpm run bench, then open unzip-stream.html
 */
import { unzip as decompress, zipSync, Unzip, AsyncUnzipInflate, UnzipPassThrough, type UnzipFile, type Zippable } from 'fflate/browser';
import { Future } from 'tiny-future';

const output = document.getElementById('output')!;

function log(message: string): void {
    const line = document.createElement('div');
    line.textContent = message;
    output.appendChild(line);
    console.log(message);
}

function createTestZip(fileCount: number, fileSizeKB: number): Uint8Array {
    const files: Zippable = {};
    const content = new Uint8Array(fileSizeKB * 1024);
    // Fill with random-ish data to prevent extreme compression
    for (let i = 0; i < content.length; i++) {
        content[i] = (i * 17 + 13) % 256;
    }

    for (let i = 0; i < fileCount; i++) {
        files[`file${i}.bin`] = content;
    }

    return zipSync(files);
}

/**
 * Batch unzip - loads entire zip and decompresses all at once
 */
async function benchmarkBatch(zipData: Uint8Array, iterations: number): Promise<number> {
    const start = performance.now();

    for (let i = 0; i < iterations; i++) {
        const future = new Future<void>();
        decompress(zipData, (err) => {
            if (err) throw err;
            future.resolve();
        });
        await future.promise;
    }

    return performance.now() - start;
}

/**
 * Streaming unzip - simulates streaming by chunking the zip data
 */
async function benchmarkStream(zipData: Uint8Array, chunkSize: number, iterations: number): Promise<number> {
    const start = performance.now();

    for (let i = 0; i < iterations; i++) {
        await streamUnzip(zipData, chunkSize);
    }

    return performance.now() - start;
}

/**
 * Perform streaming unzip on zip data
 */
function streamUnzip(zipData: Uint8Array, chunkSize: number): Promise<void> {
    return new Promise((resolve, reject) => {
        const unzipper = new Unzip();
        unzipper.register(UnzipPassThrough);
        unzipper.register(AsyncUnzipInflate);

        const filePromises: Promise<void>[] = [];

        unzipper.onfile = (file: UnzipFile) => {
            // Skip directories
            if (file.name.endsWith('/')) return;

            const promise = new Promise<void>((fileResolve, fileReject) => {
                const chunks: Uint8Array[] = [];

                file.ondata = (err, data, final) => {
                    if (err) {
                        fileReject(err);
                        return;
                    }
                    chunks.push(data);
                    if (final) {
                        // Simulate what we'd do: concatenate chunks
                        const totalLength = chunks.reduce((sum, c) => sum + c.length, 0);
                        const result = new Uint8Array(totalLength);
                        let offset = 0;
                        for (const chunk of chunks) {
                            result.set(chunk, offset);
                            offset += chunk.length;
                        }
                        fileResolve();
                    }
                };

                file.start();
            });

            filePromises.push(promise);
        };

        try {
            // Push data in chunks to simulate streaming
            let offset = 0;
            while (offset < zipData.length) {
                const end = Math.min(offset + chunkSize, zipData.length);
                const chunk = zipData.slice(offset, end);
                const isFinal = end >= zipData.length;
                unzipper.push(chunk, isFinal);
                offset = end;
            }

            Promise.all(filePromises).then(() => resolve()).catch(reject);
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
    chunkSize: number; // Chunk size for streaming (bytes)
}

async function runBenchmark(config: BenchmarkConfig): Promise<void> {
    const { name, fileCount, fileSizeKB, iterations, chunkSize } = config;
    const zipData = createTestZip(fileCount, fileSizeKB);
    const uncompressedSize = fileCount * fileSizeKB;

    log(`\n${name}`);
    log(`Zip size: ${(zipData.byteLength / 1024).toFixed(2)} KB, Uncompressed: ${uncompressedSize} KB`);
    log(`Chunk size: ${(chunkSize / 1024).toFixed(0)} KB`);

    // Warm up
    await benchmarkBatch(zipData, 1);
    await benchmarkStream(zipData, chunkSize, 1);

    const batchTime = await benchmarkBatch(zipData, iterations);
    const streamTime = await benchmarkStream(zipData, chunkSize, iterations);

    const batchAvg = batchTime / iterations;
    const streamAvg = streamTime / iterations;
    const ratio = streamAvg / batchAvg;

    log(`Batch:  ${batchAvg.toFixed(2)} ms/op`);
    log(`Stream: ${streamAvg.toFixed(2)} ms/op`);
    log(`Ratio:  ${ratio.toFixed(2)}x (stream is ${ratio > 1 ? 'slower' : 'faster'})`);
}

async function runAllBenchmarks(): Promise<void> {
    output.textContent = '';
    log('=== Batch vs Streaming Unzip Benchmark ===');
    log('Measuring pure decompression overhead (no actual file I/O)');

    const chunkSize = 64 * 1024; // 64KB chunks (typical streaming chunk)

    const benchmarks: BenchmarkConfig[] = [
        { name: 'Small (10 files x 10KB = 100KB)', fileCount: 10, fileSizeKB: 10, iterations: 50, chunkSize },
        { name: 'Medium (50 files x 100KB = 5MB)', fileCount: 50, fileSizeKB: 100, iterations: 10, chunkSize },
        { name: 'Large (10 files x 1MB = 10MB)', fileCount: 10, fileSizeKB: 1024, iterations: 5, chunkSize },
        { name: 'XLarge (100 files x 1MB = 100MB)', fileCount: 100, fileSizeKB: 1024, iterations: 2, chunkSize },
    ];

    for (const config of benchmarks) {
        await runBenchmark(config);
    }

    log('\n=== Benchmark Complete ===');
    log('\nNote: Stream mode trades speed for memory efficiency.');
    log('For large files that exceed available memory, streaming is the only option.');
}

document.getElementById('run')!.addEventListener('click', () => {
    runAllBenchmarks().catch((err) => {
        log(`Error: ${err.message}`);
    });
});
