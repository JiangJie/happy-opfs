import { playwright } from 'vite-plus/test/browser-playwright';
import mkcert from 'vite-plugin-mkcert';
import { defineConfig } from 'vite-plus';

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
            'Cross-Origin-Embedder-Policy': 'require-corp',
        },
    },
    publicDir: 'tests/public',
    test: {
        // Use Playwright browser environment for OPFS testing
        browser: {
            enabled: true,
            provider: playwright({
                launchOptions: {
                    // Ignore HTTPS certificate errors for self-signed certs
                    // Required for MSW Service Worker registration in CI
                    args: ['--ignore-certificate-errors', '--ignore-certificate-errors-spki-list'],
                },
            }),
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
                'src/sync/channel/listen.ts', // Worker thread code - runs entirely in Worker context
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
    lint: {
        plugins: ['typescript', 'oxc', 'eslint', 'import', 'unicorn', 'vitest'],
        ignorePatterns: ['coverage', 'dist', 'docs', '**/public'],
        options: {
            typeAware: true,
            typeCheck: true,
            maxWarnings: 0,
            reportUnusedDisableDirectives: 'warn',
        },
        categories: {
            correctness: 'error',
            suspicious: 'warn',
        },
        rules: {
            // Tier 1 — daily-active conventions enforced on every file.
            // `import/extensions` keeps the explicit `.ts` extension convention on
            // relative imports.
            'import/extensions': ['error', 'always', { ignorePackages: true }],
            'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],

            // Tier 2 — fuses: zero hits means they are working. Each prevents an
            // accident that is expensive when it slips through.
            eqeqeq: ['error', 'always', { null: 'ignore' }],
            'no-cond-assign': ['error', 'always'],
            radix: 'error',
            // The two intentional `any` uses (matching the native AbortController
            // signature) carry local eslint-disable directives.
            'typescript/no-explicit-any': 'error',

            // Tier 3 — review automation: the machine enforces style so human review
            // does not have to.
            'no-self-compare': 'error',
            'no-template-curly-in-string': 'error',
            'default-case-last': 'error',
            'no-new-wrappers': 'error',
            'prefer-template': 'error',
            'object-shorthand': 'error',
            'import/no-duplicates': 'error',
            'vitest/no-disabled-tests': 'warn',
            'vitest/no-identical-title': 'error',

            // Off — disabled for false-positive cost against this project's design.
            // Narrowing assertions like `as Uint8Array<ArrayBuffer>` and `e as Error`
            // in catch clauses are documented, intentional patterns (see AGENTS.md).
            'typescript/no-unsafe-type-assertion': 'off',
            // Phantom generics such as `writeJsonFile<T>` / `decodePayload<T>` are
            // required for type inference at call sites.
            'typescript/no-unnecessary-type-parameters': 'off',
            // Worker.postMessage has no targetOrigin parameter; the rule targets
            // window.postMessage and misfires on Worker/MessagePort call sites.
            'unicorn/require-post-message-target-origin': 'off',
            // MessagePort channels use single-handler assignment (`port.onmessage`)
            // deliberately: the protocol owns the only listener and unloads via `= null`.
            'unicorn/prefer-add-event-listener': 'off',
            // Local closures shadowing outer names are idiomatic in this codebase.
            'no-shadow': 'off',
        },
        overrides: [
            {
                files: ['tests/**'],
                rules: {
                    // tests/worker-no-listen.ts is an intentionally empty worker fixture
                    // (its absence of listen() is the test input for connect timeout).
                    'unicorn/no-empty-file': 'off',
                    // Result-based tests assert inside `isOk()/isErr()` branches by
                    // design; each branch carries its own expectations.
                    'vitest/no-conditional-expect': 'off',
                    // Asserting `expect(task.abort).toBeDefined()` references methods
                    // without calling them — intentional shape checks.
                    'typescript/unbound-method': 'off',
                },
            },
            {
                files: ['benchmarks/**'],
                rules: {
                    // Benchmark samplers mutate loop flags across async boundaries,
                    // which the rule cannot see.
                    'no-unmodified-loop-condition': 'off',
                },
            },
        ],
    },
    fmt: {
        printWidth: 100,
        tabWidth: 4,
        singleQuote: true,
        arrowParens: 'avoid',
        semi: true,
        trailingComma: 'all',
        sortPackageJson: false,
        ignorePatterns: ['coverage', 'dist', 'docs', 'pnpm-lock.yaml'],
        overrides: [
            {
                files: ['**/*.json', '**/*.jsonc', '**/*.yaml', '**/*.yml'],
                options: {
                    tabWidth: 2,
                },
            },
            {
                files: ['**/*.md'],
                options: {
                    tabWidth: 2,
                    embeddedLanguageFormatting: 'off',
                },
            },
        ],
    },
});
