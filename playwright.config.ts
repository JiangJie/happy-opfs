import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir: './e2e',
    testMatch: '**/*.e2e.ts',
    fullyParallel: false, // OPFS tests may conflict if run in parallel
    forbidOnly: !!process.env['CI'],
    retries: process.env['CI'] ? 2 : 0,
    workers: 1, // Run tests sequentially to avoid OPFS conflicts
    reporter: 'html',
    use: {
        baseURL: 'https://localhost:8443',
        trace: 'on-first-retry',
        // Required headers for SharedArrayBuffer support
        extraHTTPHeaders: {
            'Cross-Origin-Opener-Policy': 'same-origin',
            'Cross-Origin-Embedder-Policy': 'require-corp',
        },
    },
    projects: [
        {
            name: 'chromium',
            use: {
                ...devices['Desktop Chrome'],
                launchOptions: {
                    args: ['--enable-features=SharedArrayBuffer'],
                },
            },
        },
    ],
    webServer: {
        command: 'pnpm start',
        url: 'https://localhost:8443',
        reuseExistingServer: !process.env['CI'],
        ignoreHTTPSErrors: true,
    },
});
