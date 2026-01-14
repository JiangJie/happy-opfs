/**
 * Benchmark: Stream vs Batch Read Performance
 *
 * Compares:
 * 1. Batch read: readFile with 'bytes' encoding (loads entire file into memory)
 * 2. Stream read: readFile with 'stream' encoding (processes chunks on-the-fly)
 *
 * Simulates real-world scenarios where stream processing can reduce peak memory.
 */
import { readFile, remove, writeFile } from '../src/mod.ts';

// ============================================================================
// Type Definitions
// ============================================================================

interface PerformanceMemory {
    totalJSHeapSize: number;
    usedJSHeapSize: number;
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

function hasMemoryAPI(): boolean {
    return typeof (performance as PerformanceWithMemory).memory !== 'undefined';
}

function getUsedMemory(): number {
    const mem = (performance as PerformanceWithMemory).memory;
    return mem?.usedJSHeapSize ?? 0;
}

async function tryGC(): Promise<void> {
    if (typeof globalThis.gc === 'function') {
        globalThis.gc();
    }
    for (let i = 0; i < 3; i++) {
        await new Promise(resolve => setTimeout(resolve, 100));
        if (typeof globalThis.gc === 'function') {
            globalThis.gc();
        }
    }
}

/**
 * Generate test data and write to file.
 */
async function createTestFile(filePath: string, size: number): Promise<void> {
    log(`Creating test file: ${formatBytes(size)}...`, 'info');
    const data = new Uint8Array(size);
    for (let i = 0; i < size; i++) {
        data[i] = (i * 17 + 13) % 256;
    }
    const res = await writeFile(filePath, data as Uint8Array<ArrayBuffer>);
    if (res.isErr()) {
        throw res.unwrapErr();
    }
    log('Test file created.', 'info');
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
    peakMemory: number;
    baselineMemory: number;
}

interface MemorySample {
    timestamp: number;
    memory: number;
}

async function runWithMemorySampling<T>(
    fn: () => Promise<T>,
    intervalMs = 10,
): Promise<{ result: T; samples: MemorySample[]; peakMemory: number }> {
    const samples: MemorySample[] = [];
    let peakMemory = 0;
    let sampling = true;

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

async function benchmarkBatchRead(
    filePath: string,
    fileSize: number,
    iterations: number,
): Promise<BenchmarkResult> {
    const name = 'Batch Read (bytes encoding)';
    log(`\n${name}`, 'header');
    log('  (Entire file loaded into memory as Uint8Array)', 'info');

    return runBenchmark(
        name,
        async () => {
            const res = await readFile(filePath, { encoding: 'bytes' });
            if (res.isErr()) {
                throw res.unwrapErr();
            }
            const data = res.unwrap();
            // Simulate processing: compute checksum
            let checksum = 0;
            for (let i = 0; i < data.length; i += 1024) {
                checksum += data[i]!;
            }
            // Prevent optimization from removing the read
            if (checksum < 0) console.log(checksum);
        },
        iterations,
        fileSize,
    );
}

async function benchmarkStreamRead(
    filePath: string,
    fileSize: number,
    iterations: number,
): Promise<BenchmarkResult> {
    const name = 'Stream Read (stream encoding)';
    log(`\n${name}`, 'header');
    log('  (File read as chunks via ReadableStream)', 'info');

    return runBenchmark(
        name,
        async () => {
            const res = await readFile(filePath, { encoding: 'stream' });
            if (res.isErr()) {
                throw res.unwrapErr();
            }
            const stream = res.unwrap();
            const reader = stream.getReader();

            // Simulate processing: compute checksum from chunks
            let checksum = 0;
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                // Process chunk without keeping reference
                for (let i = 0; i < value.length; i += 1024) {
                    checksum += value[i]!;
                }
            }
            // Prevent optimization from removing the read
            if (checksum < 0) console.log(checksum);
        },
        iterations,
        fileSize,
    );
}

async function benchmarkBatchReadWithCopy(
    filePath: string,
    fileSize: number,
    iterations: number,
): Promise<BenchmarkResult> {
    const name = 'Batch Read + Process (simulated transform)';
    log(`\n${name}`, 'header');
    log('  (Load entire file, then transform/copy)', 'info');

    return runBenchmark(
        name,
        async () => {
            const res = await readFile(filePath, { encoding: 'bytes' });
            if (res.isErr()) {
                throw res.unwrapErr();
            }
            const data = res.unwrap();
            // Simulate transform: create a modified copy (doubles memory)
            const transformed = new Uint8Array(data.length);
            for (let i = 0; i < data.length; i++) {
                transformed[i] = (data[i]! + 1) % 256;
            }
            // Prevent optimization
            if (transformed[0] === 255) console.log('unlikely');
        },
        iterations,
        fileSize,
    );
}

async function benchmarkStreamReadWithTransform(
    filePath: string,
    fileSize: number,
    iterations: number,
): Promise<BenchmarkResult> {
    const name = 'Stream Read + Process (chunk-by-chunk transform)';
    log(`\n${name}`, 'header');
    log('  (Transform each chunk without keeping full file in memory)', 'info');

    return runBenchmark(
        name,
        async () => {
            const res = await readFile(filePath, { encoding: 'stream' });
            if (res.isErr()) {
                throw res.unwrapErr();
            }
            const stream = res.unwrap();
            const reader = stream.getReader();

            // Simulate chunked transform: process and discard each chunk
            let totalProcessed = 0;
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                // Transform chunk (modify in place, no additional memory)
                for (let i = 0; i < value.length; i++) {
                    value[i] = (value[i]! + 1) % 256;
                }
                totalProcessed += value.length;
                // Chunk can now be GC'd
            }
            // Prevent optimization
            if (totalProcessed === 0) console.log('empty');
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

    // Compare batch vs stream (simple read)
    const batchSimple = results.find(r => r.name.includes('Batch Read (bytes'));
    const streamSimple = results.find(r => r.name.includes('Stream Read (stream'));

    if (batchSimple && streamSimple) {
        log(`\n${'─'.repeat(70)}`, 'info');
        const timeRatio = streamSimple.avgTime / batchSimple.avgTime;
        log(`Simple Read - Time: Stream is ${timeRatio.toFixed(2)}x ${timeRatio > 1 ? 'slower' : 'faster'} than Batch`, 'header');

        if (trackMemory && batchSimple.peakMemory >= 0 && streamSimple.peakMemory >= 0) {
            const batchPeakIncrease = batchSimple.peakMemory - batchSimple.baselineMemory;
            const streamPeakIncrease = streamSimple.peakMemory - streamSimple.baselineMemory;
            if (streamPeakIncrease > 0) {
                const memRatio = batchPeakIncrease / streamPeakIncrease;
                log(`Simple Read - Memory: Batch peak is ${memRatio.toFixed(2)}x ${memRatio > 1 ? 'higher' : 'lower'} than Stream`, 'header');
            }
        }
    }

    // Compare batch vs stream (with transform)
    const batchTransform = results.find(r => r.name.includes('Batch Read + Process'));
    const streamTransform = results.find(r => r.name.includes('Stream Read + Process'));

    if (batchTransform && streamTransform) {
        const timeRatio = streamTransform.avgTime / batchTransform.avgTime;
        log(`With Transform - Time: Stream is ${timeRatio.toFixed(2)}x ${timeRatio > 1 ? 'slower' : 'faster'} than Batch`, 'header');

        if (trackMemory && batchTransform.peakMemory >= 0 && streamTransform.peakMemory >= 0) {
            const batchPeakIncrease = batchTransform.peakMemory - batchTransform.baselineMemory;
            const streamPeakIncrease = streamTransform.peakMemory - streamTransform.baselineMemory;
            if (streamPeakIncrease > 0) {
                const memRatio = batchPeakIncrease / streamPeakIncrease;
                log(`With Transform - Memory: Batch peak is ${memRatio.toFixed(2)}x ${memRatio > 1 ? 'higher' : 'lower'} than Stream`, 'header');
            }
        }
    }

    if (!trackMemory) {
        log(`\n${'─'.repeat(70)}`, 'info');
        log('Note: Memory tracking not available (Chrome only)', 'info');
    } else {
        log(`\n${'─'.repeat(70)}`, 'info');
        log('Note: Memory sampling every 10ms. Actual peak may be higher.', 'info');
        log('      "With Transform" tests simulate data processing scenarios.', 'info');
    }
}

// ============================================================================
// Main Entry Points
// ============================================================================

function getConfig(): { fileSize: number; iterations: number } {
    return {
        fileSize: parseInt((document.getElementById('fileSize') as HTMLSelectElement).value, 10),
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

    const { fileSize, iterations } = getConfig();
    const testFilePath = '/bench-read-test.bin';

    log('='.repeat(70), 'header');
    log('STREAM VS BATCH READ BENCHMARK', 'header');
    log('='.repeat(70), 'header');
    log(`File Size: ${formatBytes(fileSize)}`);
    log(`Iterations: ${iterations}`);
    log(`Memory API: ${hasMemoryAPI() ? 'Available (sampling every 10ms)' : 'Not available (Chrome only)'}`);

    try {
        await createTestFile(testFilePath, fileSize);
        const results: BenchmarkResult[] = [];

        // Simple reads
        results.push(await benchmarkBatchRead(testFilePath, fileSize, iterations));
        results.push(await benchmarkStreamRead(testFilePath, fileSize, iterations));

        // With transform/processing
        results.push(await benchmarkBatchReadWithCopy(testFilePath, fileSize, iterations));
        results.push(await benchmarkStreamReadWithTransform(testFilePath, fileSize, iterations));

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
    const testFilePath = '/bench-read-test.bin';

    log('BATCH READ BENCHMARK', 'header');
    log(`File Size: ${formatBytes(fileSize)}, Iterations: ${iterations}`);
    log(`Memory API: ${hasMemoryAPI() ? 'Available' : 'Not available'}`);

    try {
        await createTestFile(testFilePath, fileSize);
        const results: BenchmarkResult[] = [];

        results.push(await benchmarkBatchRead(testFilePath, fileSize, iterations));
        results.push(await benchmarkBatchReadWithCopy(testFilePath, fileSize, iterations));

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

    const { fileSize, iterations } = getConfig();
    const testFilePath = '/bench-read-test.bin';

    log('STREAM READ BENCHMARK', 'header');
    log(`File Size: ${formatBytes(fileSize)}, Iterations: ${iterations}`);
    log(`Memory API: ${hasMemoryAPI() ? 'Available' : 'Not available'}`);

    try {
        await createTestFile(testFilePath, fileSize);
        const results: BenchmarkResult[] = [];

        results.push(await benchmarkStreamRead(testFilePath, fileSize, iterations));
        results.push(await benchmarkStreamReadWithTransform(testFilePath, fileSize, iterations));

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
