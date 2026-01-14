/**
 * Benchmark: Stream vs Batch Download Performance
 *
 * Compares:
 * 1. Stream Download: downloadFile API (streams directly to OPFS)
 * 2. Batch Download: fetch + arrayBuffer + writeFile (loads entire file into memory first)
 *
 * Uses MSW mock server for reliable benchmarking.
 */
import { downloadFile, remove, writeFile } from '../src/mod.ts';
import { worker } from './mocks/browser.ts';

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
 * Extract file size from URL if possible (e.g., mock.test/bytes/SIZE)
 */
function extractSizeFromUrl(url: string): number | null {
    const match = url.match(/\/bytes\/(\d+)/);
    if (match) {
        return parseInt(match[1]!, 10);
    }
    return null;
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
    downloadedBytes: number;
}

interface MemorySample {
    timestamp: number;
    memory: number;
}

async function runWithMemorySampling<T>(
    fn: () => Promise<T>,
    intervalMs = 10,
): Promise<{ result: T; samples: MemorySample[]; peakMemory: number; }> {
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
    fn: () => Promise<number>, // returns bytes downloaded
    iterations: number,
): Promise<BenchmarkResult> {
    const times: number[] = [];
    const peakMemories: number[] = [];
    const trackMemory = hasMemoryAPI();
    let baselineMemory = 0;
    let downloadedBytes = 0;

    // Warmup
    log('  Warming up...', 'info');
    downloadedBytes = await fn();
    await tryGC();

    if (trackMemory) {
        baselineMemory = getUsedMemory();
    }

    for (let i = 0; i < iterations; i++) {
        await tryGC();
        const memBefore = getUsedMemory();

        const start = performance.now();

        if (trackMemory) {
            const { result: bytes, peakMemory } = await runWithMemorySampling(fn);
            const elapsed = performance.now() - start;
            times.push(elapsed);
            peakMemories.push(peakMemory);
            downloadedBytes = bytes;

            const peakIncrease = peakMemory - memBefore;
            log(`  Iteration ${i + 1}: ${formatTime(elapsed)}, ${formatBytes(bytes)}, peak mem: +${formatBytes(peakIncrease)}`, 'info');
        } else {
            downloadedBytes = await fn();
            const elapsed = performance.now() - start;
            times.push(elapsed);
            log(`  Iteration ${i + 1}: ${formatTime(elapsed)}, ${formatBytes(downloadedBytes)}`, 'info');
        }
    }

    const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    const throughput = (downloadedBytes / 1024 / 1024) / (avgTime / 1000);

    const peakMemory = peakMemories.length > 0 ? Math.max(...peakMemories) : -1;

    return { name, avgTime, minTime, maxTime, throughput, peakMemory, baselineMemory, downloadedBytes };
}

async function benchmarkStreamDownload(
    url: string,
    filePath: string,
    iterations: number,
): Promise<BenchmarkResult> {
    const name = 'Stream Download (downloadFile API)';
    log(`\n${name}`, 'header');
    log('  (Streams response body directly to OPFS)', 'info');

    return runBenchmark(
        name,
        async () => {
            await remove(filePath);
            const task = downloadFile(url, filePath);
            const res = await task.result;
            if (res.isErr()) {
                throw res.unwrapErr();
            }
            // Get actual downloaded size
            const response = res.unwrap();
            const contentLength = response.headers.get('content-length');
            return contentLength ? parseInt(contentLength, 10) : 0;
        },
        iterations,
    );
}

async function benchmarkBatchDownload(
    url: string,
    filePath: string,
    iterations: number,
): Promise<BenchmarkResult> {
    const name = 'Batch Download (fetch + arrayBuffer + writeFile)';
    log(`\n${name}`, 'header');
    log('  (Loads entire response into memory, then writes to OPFS)', 'info');

    return runBenchmark(
        name,
        async () => {
            await remove(filePath);

            // Simulate traditional batch approach
            const response = await fetch(url);
            const data = await response.arrayBuffer();
            const res = await writeFile(filePath, new Uint8Array(data) as Uint8Array<ArrayBuffer>);
            if (res.isErr()) {
                throw res.unwrapErr();
            }
            return data.byteLength;
        },
        iterations,
    );
}

function printResults(results: BenchmarkResult[]): void {
    const trackMemory = hasMemoryAPI();

    log(`\n${'='.repeat(70)}`, 'header');
    log('RESULTS SUMMARY', 'header');
    log('='.repeat(70), 'header');

    for (const r of results) {
        log(`\n${r.name}:`, 'result');
        log(`  Downloaded: ${formatBytes(r.downloadedBytes)}`, 'result');
        log(`  Time:       Avg ${formatTime(r.avgTime)}, Min ${formatTime(r.minTime)}, Max ${formatTime(r.maxTime)}`, 'result');
        log(`  Throughput: ${r.throughput.toFixed(2)} MB/s`, 'result');
        if (trackMemory && r.peakMemory >= 0) {
            const peakIncrease = r.peakMemory - r.baselineMemory;
            log(`  Peak Memory: ${formatBytes(r.peakMemory)} (+${formatBytes(peakIncrease)} from baseline)`, 'result');
        }
    }

    const streamResult = results.find(r => r.name.includes('Stream'));
    const batchResult = results.find(r => r.name.includes('Batch'));

    if (streamResult && batchResult) {
        log(`\n${'─'.repeat(70)}`, 'info');
        const timeRatio = streamResult.avgTime / batchResult.avgTime;
        log(`Time: Stream is ${timeRatio.toFixed(2)}x ${timeRatio > 1 ? 'slower' : 'faster'} than Batch`, 'header');

        if (trackMemory && batchResult.peakMemory >= 0 && streamResult.peakMemory >= 0) {
            const batchPeakIncrease = batchResult.peakMemory - batchResult.baselineMemory;
            const streamPeakIncrease = streamResult.peakMemory - streamResult.baselineMemory;
            if (streamPeakIncrease > 0) {
                const memRatio = batchPeakIncrease / streamPeakIncrease;
                log(`Memory: Batch peak is ${memRatio.toFixed(2)}x ${memRatio > 1 ? 'higher' : 'lower'} than Stream`, 'header');
            }
        }
    }

    if (!trackMemory) {
        log(`\n${'─'.repeat(70)}`, 'info');
        log('Note: Memory tracking not available (Chrome only)', 'info');
    } else {
        log(`\n${'─'.repeat(70)}`, 'info');
        log('Note: Memory sampling every 10ms. Actual peak may be higher.', 'info');
        log('      Stream downloads write directly to OPFS without buffering.', 'info');
        log('      Batch downloads load entire file into memory before writing.', 'info');
        log('      Network speed affects results - run multiple times for accuracy.', 'info');
    }
}

// ============================================================================
// Main Entry Points
// ============================================================================

function getConfig(): { url: string; iterations: number; } {
    const preset = (document.getElementById('urlPreset') as HTMLSelectElement).value;
    const customUrl = (document.getElementById('customUrl') as HTMLInputElement).value;

    return {
        url: preset === 'custom' ? customUrl : preset,
        iterations: parseInt((document.getElementById('iterations') as HTMLInputElement).value, 10),
    };
}

function setButtonsDisabled(disabled: boolean): void {
    ['runAll', 'runStream', 'runBatch'].forEach(id => {
        (document.getElementById(id) as HTMLButtonElement).disabled = disabled;
    });
}

async function runAllBenchmarks(): Promise<void> {
    setButtonsDisabled(true);
    clearOutput();

    const { url, iterations } = getConfig();
    const testFilePath = '/bench-download-test.bin';

    if (!url) {
        log('Error: Please enter a valid URL', 'error');
        setButtonsDisabled(false);
        return;
    }

    const expectedSize = extractSizeFromUrl(url);

    log('='.repeat(70), 'header');
    log('STREAM VS BATCH DOWNLOAD BENCHMARK', 'header');
    log('='.repeat(70), 'header');
    log(`URL: ${url}`);
    if (expectedSize) {
        log(`Expected Size: ${formatBytes(expectedSize)}`);
    }
    log(`Iterations: ${iterations}`);
    log(`Memory API: ${hasMemoryAPI() ? 'Available (sampling every 10ms)' : 'Not available (Chrome only)'}`);

    try {
        const results: BenchmarkResult[] = [];

        results.push(await benchmarkStreamDownload(url, testFilePath, iterations));
        results.push(await benchmarkBatchDownload(url, testFilePath, iterations));

        printResults(results);

        // Cleanup
        await remove(testFilePath);
        log('\nBenchmark complete. Test file cleaned up.', 'info');
    } catch (err) {
        log(`\nError: ${(err as Error).message}`, 'error');
        console.error(err);
    } finally {
        setButtonsDisabled(false);
    }
}

async function runStreamOnly(): Promise<void> {
    setButtonsDisabled(true);
    clearOutput();

    const { url, iterations } = getConfig();
    const testFilePath = '/bench-download-test.bin';

    if (!url) {
        log('Error: Please enter a valid URL', 'error');
        setButtonsDisabled(false);
        return;
    }

    log('STREAM DOWNLOAD BENCHMARK', 'header');
    log(`URL: ${url}, Iterations: ${iterations}`);

    try {
        const results: BenchmarkResult[] = [];
        results.push(await benchmarkStreamDownload(url, testFilePath, iterations));
        printResults(results);
        await remove(testFilePath);
    } catch (err) {
        log(`\nError: ${(err as Error).message}`, 'error');
    } finally {
        setButtonsDisabled(false);
    }
}

async function runBatchOnly(): Promise<void> {
    setButtonsDisabled(true);
    clearOutput();

    const { url, iterations } = getConfig();
    const testFilePath = '/bench-download-test.bin';

    if (!url) {
        log('Error: Please enter a valid URL', 'error');
        setButtonsDisabled(false);
        return;
    }

    log('BATCH DOWNLOAD BENCHMARK', 'header');
    log(`URL: ${url}, Iterations: ${iterations}`);

    try {
        const results: BenchmarkResult[] = [];
        results.push(await benchmarkBatchDownload(url, testFilePath, iterations));
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
document.getElementById('runStream')!.addEventListener('click', runStreamOnly);
document.getElementById('runBatch')!.addEventListener('click', runBatchOnly);
document.getElementById('clear')!.addEventListener('click', clearOutput);

// Show/hide custom URL input
document.getElementById('urlPreset')!.addEventListener('change', (e) => {
    const preset = (e.target as HTMLSelectElement).value;
    const customContainer = document.getElementById('customUrlContainer')!;
    customContainer.style.display = preset === 'custom' ? 'block' : 'none';
});

// ============================================================================
// MSW Initialization
// ============================================================================

async function initMSW(): Promise<void> {
    // Disable buttons until MSW is ready
    setButtonsDisabled(true);
    log('Initializing MSW mock server...', 'info');

    try {
        await worker.start({
            serviceWorker: {
                url: '/mockServiceWorker.js',
            },
            onUnhandledRequest: 'bypass',
            quiet: true,
        });
        log('MSW mock server ready!', 'result');
    } catch (err) {
        log(`Failed to initialize MSW: ${(err as Error).message}`, 'error');
        log('Falling back to direct requests (Custom URLs only)', 'info');
    } finally {
        setButtonsDisabled(false);
    }
}

// Initialize MSW on page load
initMSW();
