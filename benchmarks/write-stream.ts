/**
 * Benchmark: Stream vs Batch Write Performance
 *
 * Compares:
 * 1. Batch write: writeFile with Uint8Array (data fully loaded in memory)
 * 2. Stream write: writeFile with ReadableStream (data generated on-the-fly)
 *
 * Simulates real-world scenarios like downloading from network where
 * stream processing can reduce peak memory usage.
 */
import { remove, writeFile } from '../src/mod.ts';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Chrome's non-standard memory API.
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Performance/memory
 */
interface PerformanceMemory {
    /** Total heap size in bytes */
    totalJSHeapSize: number;
    /** Used heap size in bytes */
    usedJSHeapSize: number;
    /** Maximum heap size in bytes */
    jsHeapSizeLimit: number;
}

interface PerformanceWithMemory extends Performance {
    memory?: PerformanceMemory;
}

// ============================================================================
// Utility Functions
// ============================================================================

function log(message: string, className = ''): void {
    const output = document.getElementById('output')!;
    const span = document.createElement('span');
    span.className = className;
    span.textContent = `${message}\n`;
    output.appendChild(span);
    output.scrollTop = output.scrollHeight;
}

function clearOutput(): void {
    document.getElementById('output')!.innerHTML = '';
}

function formatBytes(bytes: number): string {
    if (bytes < 0) return `-${formatBytes(-bytes)}`;
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function formatTime(ms: number): string {
    if (ms < 1) return `${(ms * 1000).toFixed(0)} μs`;
    if (ms < 1000) return `${ms.toFixed(2)} ms`;
    return `${(ms / 1000).toFixed(2)} s`;
}

/**
 * Check if memory API is available (Chrome only).
 */
function hasMemoryAPI(): boolean {
    return typeof (performance as PerformanceWithMemory).memory !== 'undefined';
}

/**
 * Get current used heap size in bytes.
 * Returns 0 if memory API is not available.
 */
function getUsedMemory(): number {
    const mem = (performance as PerformanceWithMemory).memory;
    return mem?.usedJSHeapSize ?? 0;
}

/**
 * Force garbage collection if available and wait for memory to stabilize.
 */
async function tryGC(): Promise<void> {
    if (typeof globalThis.gc === 'function') {
        globalThis.gc();
    }
    // Multiple rounds to ensure memory is stabilized
    for (let i = 0; i < 3; i++) {
        await new Promise(resolve => setTimeout(resolve, 100));
        if (typeof globalThis.gc === 'function') {
            globalThis.gc();
        }
    }
}

/**
 * Generate a single chunk of pseudo-random data.
 */
function generateChunk(chunkIndex: number, chunkSize: number): Uint8Array<ArrayBuffer> {
    const chunk = new Uint8Array(chunkSize);
    const seed = chunkIndex * chunkSize;
    for (let i = 0; i < chunkSize; i++) {
        chunk[i] = ((seed + i) * 17 + 13) % 256;
    }
    return chunk as Uint8Array<ArrayBuffer>;
}

/**
 * Generate complete test data (simulates batch scenario where all data is in memory).
 */
function generateCompleteData(totalSize: number): Uint8Array<ArrayBuffer> {
    const data = new Uint8Array(totalSize);
    for (let i = 0; i < totalSize; i++) {
        data[i] = (i * 17 + 13) % 256;
    }
    return data as Uint8Array<ArrayBuffer>;
}

/**
 * Create a ReadableStream that generates data on-the-fly (simulates network stream).
 * Data is NOT pre-loaded into memory - chunks are created as they are consumed.
 */
function createOnTheFlyStream(totalSize: number, chunkSize: number): ReadableStream<Uint8Array<ArrayBuffer>> {
    let bytesGenerated = 0;
    let chunkIndex = 0;

    return new ReadableStream({
        pull(controller) {
            if (bytesGenerated >= totalSize) {
                controller.close();
                return;
            }

            const remainingBytes = totalSize - bytesGenerated;
            const thisChunkSize = Math.min(chunkSize, remainingBytes);
            const chunk = generateChunk(chunkIndex, thisChunkSize);

            controller.enqueue(chunk);
            bytesGenerated += thisChunkSize;
            chunkIndex++;
        },
    });
}

// ============================================================================
// Benchmark Functions
// ============================================================================

interface BenchmarkResult {
    name: string;
    avgTime: number;
    minTime: number;
    maxTime: number;
    throughput: number;
    /** Peak memory during benchmark (bytes), -1 if not available */
    peakMemory: number;
    /** Baseline memory before benchmark (bytes), -1 if not available */
    baselineMemory: number;
}

interface MemorySample {
    timestamp: number;
    memory: number;
}

/**
 * Sample memory usage during an async operation.
 * Returns peak memory observed.
 */
async function runWithMemorySampling<T>(
    fn: () => Promise<T>,
    intervalMs = 10,
): Promise<{ result: T; samples: MemorySample[]; peakMemory: number }> {
    const samples: MemorySample[] = [];
    let peakMemory = 0;
    let sampling = true;

    // Start sampling in background
    const sampler = (async () => {
        while (sampling) {
            const mem = getUsedMemory();
            samples.push({ timestamp: performance.now(), memory: mem });
            peakMemory = Math.max(peakMemory, mem);
            await new Promise(resolve => setTimeout(resolve, intervalMs));
        }
    })();

    try {
        const result = await fn();
        return { result, samples, peakMemory };
    } finally {
        sampling = false;
        await sampler;
    }
}

async function runBenchmark(
    name: string,
    fn: () => Promise<void>,
    iterations: number,
    dataSize: number,
): Promise<BenchmarkResult> {
    const times: number[] = [];
    const peakMemories: number[] = [];
    const trackMemory = hasMemoryAPI();
    let baselineMemory = 0;

    // Warmup
    await fn();
    await tryGC();

    if (trackMemory) {
        baselineMemory = getUsedMemory();
    }

    for (let i = 0; i < iterations; i++) {
        await tryGC();
        const memBefore = getUsedMemory();

        const start = performance.now();

        if (trackMemory) {
            const { peakMemory } = await runWithMemorySampling(fn);
            const elapsed = performance.now() - start;
            times.push(elapsed);
            peakMemories.push(peakMemory);

            const peakIncrease = peakMemory - memBefore;
            log(`  Iteration ${i + 1}: ${formatTime(elapsed)}, peak mem: +${formatBytes(peakIncrease)}`, 'info');
        } else {
            await fn();
            const elapsed = performance.now() - start;
            times.push(elapsed);
            log(`  Iteration ${i + 1}: ${formatTime(elapsed)}`, 'info');
        }
    }

    const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    const throughput = (dataSize / 1024 / 1024) / (avgTime / 1000);

    const peakMemory = peakMemories.length > 0 ? Math.max(...peakMemories) : -1;

    return { name, avgTime, minTime, maxTime, throughput, peakMemory, baselineMemory };
}

async function benchmarkBatchWrite(
    filePath: string,
    fileSize: number,
    iterations: number,
    isNewFile: boolean,
): Promise<BenchmarkResult> {
    const name = `Batch Write (${isNewFile ? 'new file' : 'overwrite'})`;
    log(`\n${name}`, 'header');
    log('  (All data loaded into memory before write)', 'info');

    return runBenchmark(
        name,
        async () => {
            if (isNewFile) {
                await remove(filePath);
            }
            // Generate complete data in memory (simulates: const data = await response.arrayBuffer())
            const data = generateCompleteData(fileSize);
            const res = await writeFile(filePath, data);
            if (res.isErr()) {
                throw res.unwrapErr();
            }
        },
        iterations,
        fileSize,
    );
}

async function benchmarkStreamWrite(
    filePath: string,
    fileSize: number,
    chunkSize: number,
    iterations: number,
    isNewFile: boolean,
): Promise<BenchmarkResult> {
    const name = `Stream Write (${isNewFile ? 'new file' : 'overwrite'}, ${formatBytes(chunkSize)} chunks)`;
    log(`\n${name}`, 'header');
    log('  (Data generated on-the-fly, simulating network stream)', 'info');

    return runBenchmark(
        name,
        async () => {
            if (isNewFile) {
                await remove(filePath);
            }
            // Generate data on-the-fly (simulates: response.body stream)
            const stream = createOnTheFlyStream(fileSize, chunkSize);
            const res = await writeFile(filePath, stream);
            if (res.isErr()) {
                throw res.unwrapErr();
            }
        },
        iterations,
        fileSize,
    );
}

function printResults(results: BenchmarkResult[]): void {
    const trackMemory = hasMemoryAPI();

    log(`\n${'='.repeat(70)}`, 'header');
    log('RESULTS SUMMARY', 'header');
    log('='.repeat(70), 'header');

    for (const r of results) {
        log(`\n${r.name}:`, 'result');
        log(`  Time:       Avg ${formatTime(r.avgTime)}, Min ${formatTime(r.minTime)}, Max ${formatTime(r.maxTime)}`, 'result');
        log(`  Throughput: ${r.throughput.toFixed(2)} MB/s`, 'result');
        if (trackMemory && r.peakMemory >= 0) {
            const peakIncrease = r.peakMemory - r.baselineMemory;
            log(`  Peak Memory: ${formatBytes(r.peakMemory)} (+${formatBytes(peakIncrease)} from baseline)`, 'result');
        }
    }

    // Compare batch vs stream for new files
    const batchNew = results.find(r => r.name.includes('Batch') && r.name.includes('new'));
    const streamNew = results.find(r => r.name.includes('Stream') && r.name.includes('new'));

    if (batchNew && streamNew) {
        log(`\n${'─'.repeat(70)}`, 'info');
        const timeRatio = streamNew.avgTime / batchNew.avgTime;
        log(`New File - Time: Stream is ${timeRatio.toFixed(2)}x ${timeRatio > 1 ? 'slower' : 'faster'} than Batch`, 'header');

        if (trackMemory && batchNew.peakMemory >= 0 && streamNew.peakMemory >= 0) {
            const batchPeakIncrease = batchNew.peakMemory - batchNew.baselineMemory;
            const streamPeakIncrease = streamNew.peakMemory - streamNew.baselineMemory;
            if (streamPeakIncrease > 0) {
                const memRatio = batchPeakIncrease / streamPeakIncrease;
                log(`New File - Memory: Batch peak is ${memRatio.toFixed(2)}x ${memRatio > 1 ? 'higher' : 'lower'} than Stream`, 'header');
            }
        }
    }

    // Compare batch vs stream for overwrite
    const batchOverwrite = results.find(r => r.name.includes('Batch') && r.name.includes('overwrite'));
    const streamOverwrite = results.find(r => r.name.includes('Stream') && r.name.includes('overwrite'));

    if (batchOverwrite && streamOverwrite) {
        const timeRatio = streamOverwrite.avgTime / batchOverwrite.avgTime;
        log(`Overwrite - Time: Stream is ${timeRatio.toFixed(2)}x ${timeRatio > 1 ? 'slower' : 'faster'} than Batch`, 'header');

        if (trackMemory && batchOverwrite.peakMemory >= 0 && streamOverwrite.peakMemory >= 0) {
            const batchPeakIncrease = batchOverwrite.peakMemory - batchOverwrite.baselineMemory;
            const streamPeakIncrease = streamOverwrite.peakMemory - streamOverwrite.baselineMemory;
            if (streamPeakIncrease > 0) {
                const memRatio = batchPeakIncrease / streamPeakIncrease;
                log(`Overwrite - Memory: Batch peak is ${memRatio.toFixed(2)}x ${memRatio > 1 ? 'higher' : 'lower'} than Stream`, 'header');
            }
        }
    }

    if (!trackMemory) {
        log(`\n${'─'.repeat(70)}`, 'info');
        log('Note: Memory tracking not available (Chrome only, requires performance.memory)', 'info');
    } else {
        log(`\n${'─'.repeat(70)}`, 'info');
        log('Note: Memory sampling every 10ms. Actual peak may be higher.', 'info');
        log('      Stream writes generate data on-the-fly (not pre-loaded).', 'info');
        log('      Batch writes load complete data into memory before writing.', 'info');
    }
}

// ============================================================================
// Main Entry Points
// ============================================================================

function getConfig(): { fileSize: number; chunkSize: number; iterations: number } {
    return {
        fileSize: parseInt((document.getElementById('fileSize') as HTMLSelectElement).value, 10),
        chunkSize: parseInt((document.getElementById('chunkSize') as HTMLSelectElement).value, 10),
        iterations: parseInt((document.getElementById('iterations') as HTMLInputElement).value, 10),
    };
}

function setButtonsDisabled(disabled: boolean): void {
    document.querySelectorAll('button').forEach(btn => {
        (btn as HTMLButtonElement).disabled = disabled;
    });
}

async function runAllBenchmarks(): Promise<void> {
    setButtonsDisabled(true);
    clearOutput();

    const { fileSize, chunkSize, iterations } = getConfig();
    const testFilePath = '/bench-write-test.bin';

    log('='.repeat(70), 'header');
    log('STREAM VS BATCH WRITE BENCHMARK', 'header');
    log('='.repeat(70), 'header');
    log(`File Size: ${formatBytes(fileSize)}`);
    log(`Chunk Size: ${formatBytes(chunkSize)}`);
    log(`Iterations: ${iterations}`);
    log(`Memory API: ${hasMemoryAPI() ? 'Available (sampling every 10ms)' : 'Not available (Chrome only)'}`);

    try {
        const results: BenchmarkResult[] = [];

        // Batch write - new file
        results.push(await benchmarkBatchWrite(testFilePath, fileSize, iterations, true));

        // Batch write - overwrite
        results.push(await benchmarkBatchWrite(testFilePath, fileSize, iterations, false));

        // Stream write - new file
        results.push(await benchmarkStreamWrite(testFilePath, fileSize, chunkSize, iterations, true));

        // Stream write - overwrite
        results.push(await benchmarkStreamWrite(testFilePath, fileSize, chunkSize, iterations, false));

        printResults(results);

        // Cleanup
        await remove(testFilePath);
        log('\nBenchmark complete. Test file cleaned up.', 'info');
    } catch (err) {
        log(`\nError: ${(err as Error).message}`, 'error');
    } finally {
        setButtonsDisabled(false);
    }
}

async function runBatchOnly(): Promise<void> {
    setButtonsDisabled(true);
    clearOutput();

    const { fileSize, iterations } = getConfig();
    const testFilePath = '/bench-write-test.bin';

    log('BATCH WRITE BENCHMARK', 'header');
    log(`File Size: ${formatBytes(fileSize)}, Iterations: ${iterations}`);
    log(`Memory API: ${hasMemoryAPI() ? 'Available' : 'Not available'}`);

    try {
        const results: BenchmarkResult[] = [];

        results.push(await benchmarkBatchWrite(testFilePath, fileSize, iterations, true));
        results.push(await benchmarkBatchWrite(testFilePath, fileSize, iterations, false));

        printResults(results);
        await remove(testFilePath);
    } catch (err) {
        log(`\nError: ${(err as Error).message}`, 'error');
    } finally {
        setButtonsDisabled(false);
    }
}

async function runStreamOnly(): Promise<void> {
    setButtonsDisabled(true);
    clearOutput();

    const { fileSize, chunkSize, iterations } = getConfig();
    const testFilePath = '/bench-write-test.bin';

    log('STREAM WRITE BENCHMARK', 'header');
    log(`File Size: ${formatBytes(fileSize)}, Chunk Size: ${formatBytes(chunkSize)}, Iterations: ${iterations}`);
    log(`Memory API: ${hasMemoryAPI() ? 'Available' : 'Not available'}`);

    try {
        const results: BenchmarkResult[] = [];

        results.push(await benchmarkStreamWrite(testFilePath, fileSize, chunkSize, iterations, true));
        results.push(await benchmarkStreamWrite(testFilePath, fileSize, chunkSize, iterations, false));

        printResults(results);
        await remove(testFilePath);
    } catch (err) {
        log(`\nError: ${(err as Error).message}`, 'error');
    } finally {
        setButtonsDisabled(false);
    }
}

// ============================================================================
// Event Listeners
// ============================================================================

document.getElementById('runAll')!.addEventListener('click', runAllBenchmarks);
document.getElementById('runBatch')!.addEventListener('click', runBatchOnly);
document.getElementById('runStream')!.addEventListener('click', runStreamOnly);
document.getElementById('clear')!.addEventListener('click', clearOutput);
