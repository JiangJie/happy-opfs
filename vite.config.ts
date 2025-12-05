import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vite';
import mkcert from 'vite-plugin-mkcert';

export default defineConfig({
    plugins: [
        mkcert({
            source: 'coding',
        }),
    ],
    server: {
        // @ts-expect-error: https is not defined in vite types
        https: true,
        host: 'localhost',
        port: 8443,
        headers: {
            'Cross-Origin-Opener-Policy': 'same-origin',
            'Cross-Origin-Embedder-Policy': 'require-corp'
        },
    },
    test: {
        // Use Playwright browser environment for OPFS testing
        browser: {
            enabled: true,
            provider: playwright(),
            instances: [{ browser: 'chromium' }],
            headless: true,
        },
        // Coverage configuration
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html', 'lcov'],
            include: ['src/**/*.ts'],
            exclude: [
                'src/mod.ts', // Just re-exports
                'src/fs/defines.ts', // Type definitions only
            ],
        },
        // Test configuration
        include: ['tests/**/*.test.ts'],
        globals: true,
        testTimeout: 30000,
        hookTimeout: 30000,
        // Ensure sequential execution for OPFS tests to avoid conflicts
        sequence: {
            concurrent: false,
        },
        // Retry failed tests in CI
        retry: process.env['CI'] ? 2 : 0,
    },
    // Required for proper module resolution
    // resolve: {
    //     alias: {
    //         '@': '/src',
    //     },
    // },
});