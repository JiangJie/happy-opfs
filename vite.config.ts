import { playwright } from '@vitest/browser-playwright';
import dts from 'vite-plugin-dts';
import mkcert from 'vite-plugin-mkcert';
import { defineConfig } from 'vitest/config';

export default defineConfig({
    plugins: [
        mkcert({
            source: 'coding',
        }),
        dts({
            outDir: 'dist',
            rollupTypes: true, // combine declaration and type definition
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
    publicDir: 'tests/public',
    build: {
        target: 'esnext',
        minify: false,
        sourcemap: true,
        outDir: 'dist',
        lib: {
            entry: 'src/mod.ts',
            fileName: format => `main.${ format === 'esm' ? 'mjs' : 'cjs' }`,
        },
        rollupOptions: {
            output: [
                {
                    format: 'cjs',
                },
                {
                    format: 'esm',
                },
            ],
            external: [
                /^@std\/path/,
                'happy-rusty',
                'tiny-invariant',
                '@happy-ts/fetch-t',
                'tiny-future',
                'fflate/browser',
            ],
            treeshake: 'smallest',
        },
    },
    test: {
        // Use Playwright browser environment for OPFS testing
        browser: {
            enabled: true,
            provider: playwright(),
            instances: [{ browser: 'chromium' }],
            headless: true,
            // Fix port for MSW service worker registration
            api: {
                port: 8443,
                strictPort: true,
            },
        },
        // Coverage configuration
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html', 'lcov'],
            include: ['src/**/*.ts'],
            exclude: [
                'src/mod.ts', // Just re-exports
                'src/fs/defines.ts', // Type definitions only
                'src/worker/opfs_worker.ts', // Worker thread code - coverage cannot be collected from Worker context in browser tests
            ],
        },
        // Test configuration
        include: ['**/*.test.ts'],
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