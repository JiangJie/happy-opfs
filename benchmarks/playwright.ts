/**
 * Playwright-based benchmark runner
 *
 * Runs all browser benchmarks in headless Chromium and outputs results to console.
 *
 * Usage:
 *   pnpm run bench:run           # Run all benchmarks
 *   pnpm run bench:run -- zip    # Run specific benchmark
 *
 * Or directly:
 *   npx tsx benchmarks/playwright.ts [benchmark-name]
 */
import { chromium, type Page } from 'playwright';
import { createServer, type ViteDevServer } from 'vite';

interface BenchmarkResult {
    name: string;
    output: string;
    duration: number;
    success: boolean;
    error?: string;
}

// All available benchmarks
const BENCHMARKS = [
    { name: 'zip', html: 'zip.html', description: 'zip vs zipSync (main thread)' },
    { name: 'unzip', html: 'unzip.html', description: 'unzip vs unzipSync (main thread)' },
    { name: 'zip-stream', html: 'zip-stream.html', description: 'Batch vs Streaming zip' },
    { name: 'unzip-stream', html: 'unzip-stream.html', description: 'Batch vs Streaming unzip' },
    { name: 'read-stream', html: 'read-stream.html', description: 'Stream vs Batch Read' },
    { name: 'write-stream', html: 'write-stream.html', description: 'Stream vs Batch Write' },
    { name: 'download-stream', html: 'download-stream.html', description: 'Stream vs Batch Download' },
    { name: 'worker', html: 'worker.html', description: 'async vs sync inside Worker' },
];

const TIMEOUT = 120000; // 2 minutes per benchmark

async function runBenchmark(page: Page, baseUrl: string, benchmark: typeof BENCHMARKS[0]): Promise<BenchmarkResult> {
    const url = `${baseUrl}/${benchmark.html}`;
    const startTime = Date.now();

    try {
        await page.goto(url);

        // Click run button
        await page.click('#run');

        // Wait for completion
        await page.waitForFunction(
            () => {
                const output = document.getElementById('output');
                return output?.textContent?.includes('Benchmark Complete') ||
                       output?.textContent?.includes('Complete');
            },
            { timeout: TIMEOUT },
        );

        // Get results
        const output = await page.evaluate(() => {
            return document.getElementById('output')?.textContent ?? '';
        });

        return {
            name: benchmark.name,
            output,
            duration: Date.now() - startTime,
            success: true,
        };
    } catch (err) {
        return {
            name: benchmark.name,
            output: '',
            duration: Date.now() - startTime,
            success: false,
            error: (err as Error).message,
        };
    }
}

async function main(): Promise<void> {
    const args = process.argv.slice(2).filter(arg => arg !== '--');
    const filterName = args[0];

    // Filter benchmarks if name provided
    let benchmarksToRun = BENCHMARKS;
    if (filterName) {
        benchmarksToRun = BENCHMARKS.filter(b =>
            b.name.includes(filterName) || b.description.toLowerCase().includes(filterName.toLowerCase()),
        );
        if (benchmarksToRun.length === 0) {
            console.error(`No benchmarks matching "${filterName}"`);
            console.log('\nAvailable benchmarks:');
            for (const b of BENCHMARKS) {
                console.log(`  ${b.name.padEnd(16)} - ${b.description}`);
            }
            process.exit(1);
        }
    }

    console.log('='.repeat(60));
    console.log('happy-opfs Benchmark Runner (Playwright)');
    console.log('='.repeat(60));
    console.log(`\nRunning ${benchmarksToRun.length} benchmark(s)...\n`);

    // Start Vite server with HTTPS and required headers
    let server: ViteDevServer | null = null;
    try {
        server = await createServer({
            root: 'benchmarks',
            server: {
                port: 5175,
                headers: {
                    'Cross-Origin-Opener-Policy': 'same-origin',
                    'Cross-Origin-Embedder-Policy': 'require-corp',
                },
            },
        });
        await server.listen();

        const baseUrl = 'http://localhost:5175';
        console.log(`Vite server running at ${baseUrl}\n`);

        // Launch browser
        const browser = await chromium.launch({ headless: true });
        const context = await browser.newContext({ ignoreHTTPSErrors: true });
        const page = await context.newPage();

        // Capture console for debugging
        if (process.env['DEBUG']) {
            page.on('console', msg => console.log(`[browser] ${msg.text()}`));
        }

        const results: BenchmarkResult[] = [];

        for (const benchmark of benchmarksToRun) {
            console.log(`Running: ${benchmark.name} (${benchmark.description})...`);

            const result = await runBenchmark(page, baseUrl, benchmark);
            results.push(result);

            if (result.success) {
                console.log(`  Done in ${(result.duration / 1000).toFixed(1)}s\n`);
            } else {
                console.log(`  FAILED: ${result.error}\n`);
            }
        }

        await browser.close();

        // Print results
        console.log(`\n${  '='.repeat(60)}`);
        console.log('RESULTS');
        console.log('='.repeat(60));

        for (const result of results) {
            console.log(`\n### ${result.name} ###`);
            if (result.success) {
                console.log(result.output);
            } else {
                console.log(`ERROR: ${result.error}`);
            }
        }

        // Summary
        const successCount = results.filter(r => r.success).length;
        const failCount = results.filter(r => !r.success).length;

        console.log(`\n${  '='.repeat(60)}`);
        console.log(`Summary: ${successCount} passed, ${failCount} failed`);
        console.log('='.repeat(60));

        if (failCount > 0) {
            process.exit(1);
        }
    } finally {
        await server?.close();
    }
}

main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
