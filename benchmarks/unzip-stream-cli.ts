/**
 * CLI Benchmark: Batch unzip vs Streaming unzip
 *
 * Run with memory stats: npx tsx --expose-gc benchmarks/unzip-stream-cli.ts
 */
import { unzip as decompress, zipSync, Unzip, AsyncUnzipInflate, UnzipPassThrough, type UnzipFile, type Zippable } from 'fflate';

// Check if GC is available
const gcAvailable = typeof globalThis.gc === 'function';

function forceGC(): void {
    if (gcAvailable) {
        globalThis.gc!();
    }
}

function getHeapUsed(): number {
    return process.memoryUsage().heapUsed;
}

function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

interface MemoryStats {
    heapBefore: number;
    heapPeak: number;
    heapAfter: number;
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
async function benchmarkBatch(zipData: Uint8Array, iterations: number): Promise<{ time: number; memory: MemoryStats; }> {
    forceGC();
    const heapBefore = getHeapUsed();
    let heapPeak = heapBefore;

    const start = performance.now();

    for (let i = 0; i < iterations; i++) {
        await new Promise<void>((resolve, reject) => {
            decompress(zipData, (err) => {
                // Measure peak after decompression (data is in memory)
                const current = getHeapUsed();
                if (current > heapPeak) heapPeak = current;

                if (err) reject(err);
                else resolve();
            });
        });
    }

    const time = performance.now() - start;

    forceGC();
    const heapAfter = getHeapUsed();

    return { time, memory: { heapBefore, heapPeak, heapAfter } };
}

/**
 * Streaming unzip - simulates streaming by chunking the zip data
 */
async function benchmarkStream(zipData: Uint8Array, chunkSize: number, iterations: number): Promise<{ time: number; memory: MemoryStats; }> {
    forceGC();
    const heapBefore = getHeapUsed();
    let heapPeak = heapBefore;

    const start = performance.now();

    for (let i = 0; i < iterations; i++) {
        await streamUnzip(zipData, chunkSize, (current) => {
            if (current > heapPeak) heapPeak = current;
        });
    }

    const time = performance.now() - start;

    forceGC();
    const heapAfter = getHeapUsed();

    return { time, memory: { heapBefore, heapPeak, heapAfter } };
}

/**
 * Perform streaming unzip on zip data
 */
function streamUnzip(zipData: Uint8Array, chunkSize: number, onMemorySample?: (heapUsed: number) => void): Promise<void> {
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

                    // Sample memory during data processing
                    onMemorySample?.(getHeapUsed());

                    if (final) {
                        // Simulate what we'd do: concatenate chunks
                        const totalLength = chunks.reduce((sum, c) => sum + c.length, 0);
                        const result = new Uint8Array(totalLength);
                        let offset = 0;
                        for (const chunk of chunks) {
                            result.set(chunk, offset);
                            offset += chunk.length;
                        }

                        // Sample after concatenation
                        onMemorySample?.(getHeapUsed());

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
    chunkSize: number;
}

async function runBenchmark(config: BenchmarkConfig): Promise<void> {
    const { name, fileCount, fileSizeKB, iterations, chunkSize } = config;
    const zipData = createTestZip(fileCount, fileSizeKB);
    const uncompressedSize = fileCount * fileSizeKB;

    console.log(`\n${name}`);
    console.log(`Zip size: ${(zipData.byteLength / 1024).toFixed(2)} KB, Uncompressed: ${uncompressedSize} KB`);
    console.log(`Chunk size: ${(chunkSize / 1024).toFixed(0)} KB`);

    // Warm up
    await benchmarkBatch(zipData, 1);
    await benchmarkStream(zipData, chunkSize, 1);

    const batchResult = await benchmarkBatch(zipData, iterations);
    const streamResult = await benchmarkStream(zipData, chunkSize, iterations);

    const batchAvg = batchResult.time / iterations;
    const streamAvg = streamResult.time / iterations;
    const ratio = streamAvg / batchAvg;

    console.log(`Batch:  ${batchAvg.toFixed(2)} ms/op`);
    console.log(`Stream: ${streamAvg.toFixed(2)} ms/op`);
    console.log(`Ratio:  ${ratio.toFixed(2)}x (stream is ${ratio > 1 ? 'slower' : 'faster'})`);

    // Memory stats
    if (gcAvailable) {
        const batchMem = batchResult.memory;
        const streamMem = streamResult.memory;
        const batchPeakDelta = batchMem.heapPeak - batchMem.heapBefore;
        const streamPeakDelta = streamMem.heapPeak - streamMem.heapBefore;

        console.log(`Memory (peak delta):`);
        console.log(`  Batch:  +${formatBytes(batchPeakDelta)}`);
        console.log(`  Stream: +${formatBytes(streamPeakDelta)}`);
        if (batchPeakDelta > 0 && streamPeakDelta > 0) {
            const memRatio = streamPeakDelta / batchPeakDelta;
            console.log(`  Ratio:  ${memRatio.toFixed(2)}x (stream uses ${memRatio < 1 ? 'less' : 'more'} memory)`);
        }
    }
}

async function main(): Promise<void> {
    console.log('=== Batch vs Streaming Unzip Benchmark ===');
    console.log('Measuring pure decompression overhead (no actual file I/O)');

    if (!gcAvailable) {
        console.log('\nNote: Run with --expose-gc for memory statistics');
        console.log('  npx tsx --expose-gc benchmarks/unzip-stream-cli.ts\n');
    } else {
        console.log('\nGC available - memory statistics enabled\n');
    }

    const chunkSize = 64 * 1024; // 64KB chunks

    const benchmarks: BenchmarkConfig[] = [
        { name: 'Small (10 files x 10KB = 100KB)', fileCount: 10, fileSizeKB: 10, iterations: 50, chunkSize },
        { name: 'Medium (50 files x 100KB = 5MB)', fileCount: 50, fileSizeKB: 100, iterations: 10, chunkSize },
        { name: 'Large (10 files x 1MB = 10MB)', fileCount: 10, fileSizeKB: 1024, iterations: 5, chunkSize },
        { name: 'XLarge (100 files x 1MB = 100MB)', fileCount: 100, fileSizeKB: 1024, iterations: 2, chunkSize },
    ];

    for (const config of benchmarks) {
        await runBenchmark(config);
    }

    console.log('\n=== Benchmark Complete ===');
    console.log('\nNote: Stream mode trades speed for memory efficiency.');
    console.log('For large files that exceed available memory, streaming is the only option.');
}

main().catch(console.error);
