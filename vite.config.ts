import { playwright } from '@vitest/browser-playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import mkcert from 'vite-plugin-mkcert';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
    root: path.resolve(__dirname, 'tests'),
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
        // Use project root for tests
        root: path.resolve(__dirname),
        // Use Playwright browser environment for OPFS testing
        browser: {
            enabled: true,
            name: 'chromium',
            provider: playwright(),
            instances: [{ browser: 'chromium' }],
            headless: true,
            providerOptions: {
                launch: {
                    args: [
                        '--enable-features=SharedArrayBuffer',
                    ],
                },
            },
        },
        // Coverage configuration
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html', 'lcov'],
            include: ['src/**/*.ts'],
            // exclude: [
            //   'src/mod.ts', // Just re-exports
            //   'src/**/*.d.ts',
            //   'src/**/defines.ts', // Type definitions only
            // ],
            all: true,
            lines: 100,
            functions: 100,
            branches: 100,
            statements: 100,
        },
        // Test configuration
        include: ['spec/**/*.spec.ts'],
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