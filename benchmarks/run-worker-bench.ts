/**
 * Run worker benchmark using Playwright
 *
 * Usage: npx tsx benchmarks/run-worker-bench.ts
 */
import { chromium } from 'playwright';
import { createServer } from 'vite';

async function main() {
    // Start Vite server
    const server = await createServer({
        root: 'benchmarks',
        server: { port: 5175 },
    });
    await server.listen();

    const url = 'https://localhost:5175/worker.html';
    console.log(`Server running at ${url}`);

    // Launch browser
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ ignoreHTTPSErrors: true });
    const page = await context.newPage();

    // Capture console output
    page.on('console', (msg) => {
        console.log(msg.text());
    });

    await page.goto(url);

    // Click run button and wait for completion
    await page.click('#run');

    // Wait for benchmark to complete (look for "Benchmark Complete")
    await page.waitForFunction(
        () => document.getElementById('output')?.textContent?.includes('Benchmark Complete'),
        { timeout: 120000 },
    );

    // Get results
    const results = await page.evaluate(() => {
        return document.getElementById('output')?.textContent;
    });

    console.log('\n--- Full Output ---');
    console.log(results);

    await browser.close();
    await server.close();
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
