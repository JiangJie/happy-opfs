import { createRequire } from 'node:module';
import { dirname, relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import { playwright } from 'vite-plus/test/browser-playwright';
import mkcert from 'vite-plugin-mkcert';
import { defineConfig } from 'vite-plus';

import type { PackUserConfig } from 'vite-plus/pack';

// #region Pack entries
interface EntryConfig {
    name: string;
    file: string;
}

interface CjsSyncModule {
    SyncChannel: Record<string, unknown>;
}

// vp pack runs from the project root; the config file itself is bundled into a
// temp location by the config loader, so import.meta paths are unreliable here.
const rootDir = process.cwd();

// `_internal` only shapes the emitted module graph, so keep it virtual instead
// of adding a source barrel that no source module would import.
const internalEntryId = 'virtual:happy-opfs-internal';
const resolvedInternalEntryId = `\0${internalEntryId}`;

const entries: readonly EntryConfig[] = [
    { name: 'main', file: 'src/mod.ts' },
    { name: 'async', file: 'src/async/mod.ts' },
    { name: 'shared', file: 'src/shared/mod.ts' },
    { name: 'sync', file: 'src/sync/mod.ts' },
    { name: 'SyncChannel', file: 'src/sync/channel/mod.ts' },
];

// These modules must have one runtime identity across independent entries.
// In particular, duplicating channel/state.ts would split connect and sync-op state.
const internalEntryFiles = [
    'src/shared/internal/mod.ts',
    'src/sync/channel/state.ts',
    'src/sync/protocol.ts',
] as const;

// Materialize the private aggregation entry entirely inside the build pipeline.
const internalEntryPlugin = {
    name: 'internal-entry',
    resolveId(id: string): string | undefined {
        return id === internalEntryId ? resolvedInternalEntryId : undefined;
    },
    load(id: string): string | undefined {
        if (id !== resolvedInternalEntryId) return undefined;

        return internalEntryFiles
            .map(file => `export * from ${JSON.stringify(resolve(rootDir, file))};`)
            .join('\n');
    },
};

// Anything under shared/internal/ belongs to the `_internal` entry.
const internalDirPrefix = `${resolve(rootDir, 'src/shared/internal')}/`;

// Map every entry source file (and every _internal source path) to the output
// name it must be externalized to. Keys are absolute fs paths — tsdown
// externalizes resolved ids, so no raw-specifier heuristics are needed.
const externalTargets = new Map<string, string>([
    ...entries.map(({ name, file }): [string, string] => [resolve(rootDir, file), name]),
    ...internalEntryFiles.map((file): [string, string] => [resolve(rootDir, file), '_internal']),
]);

function resolveExternalTarget(id: string): string | undefined {
    const normalized = id.split(/[?#]/, 1)[0] ?? id;

    const target = externalTargets.get(normalized);
    if (target !== undefined) return target;

    if (normalized.startsWith(internalDirPrefix)) return '_internal';

    return undefined;
}

// CJS output has two interop quirks that need post-processing:
// 1. Rolldown keeps original source paths for CJS `export *` requires instead
//    of applying output.paths, so `./async/mod.ts` must be rewritten to the
//    emitted `./async.cjs`.
// 2. CJS namespace interop adds an enumerable `default` key that the original
//    inlined SyncChannel namespace did not expose. A sibling CJS entry can be
//    used directly without an ESM compatibility wrapper.
function createCjsEntryFixupPlugin(entry: EntryConfig) {
    return {
        name: 'cjs-entry-fixup',
        renderChunk(code: string, chunk: { fileName: string }): { code: string; map: null } | null {
            if (!chunk.fileName.endsWith('.cjs')) return null;

            let fixed = code;
            for (const target of entries) {
                if (target.name === entry.name) continue;

                const relativeSourcePath = relative(dirname(entry.file), target.file).replaceAll(
                    '\\',
                    '/',
                );
                const sourcePath = relativeSourcePath.startsWith('.')
                    ? relativeSourcePath
                    : `./${relativeSourcePath}`;
                const outputPath = `./${target.name}.cjs`;
                fixed = fixed.replaceAll(`require("${sourcePath}")`, `require("${outputPath}")`);
                fixed = fixed.replaceAll(`require('${sourcePath}')`, `require("${outputPath}")`);
            }

            fixed = fixed.replace(
                /let ([\w$]+) = require\((["'])\.\/SyncChannel\.cjs\2\);\n\1 = __toESM\(\1, 1\);/,
                'let $1 = require($2./SyncChannel.cjs$2);',
            );

            return fixed === code ? null : { code: fixed, map: null };
        },
    };
}

// Compare the generated namespaces instead of hard-coding API names. This
// catches CJS interop regressions (such as an enumerable `default`) while API
// additions automatically remain valid when both formats agree.
async function verifyCjsSyncChannelKeys(): Promise<void> {
    const cjsSyncModule = createRequire(resolve(rootDir, 'package.json'))(
        resolve(rootDir, 'dist/sync.cjs'),
    ) as CjsSyncModule;
    const cjsSyncChannelKeys = Object.keys(cjsSyncModule.SyncChannel).toSorted();
    const esmSyncChannelModule = (await import(
        pathToFileURL(resolve(rootDir, 'dist/SyncChannel.mjs')).href
    )) as Record<string, unknown>;
    const esmSyncChannelKeys = Object.keys(esmSyncChannelModule).toSorted();
    if (cjsSyncChannelKeys.join() !== esmSyncChannelKeys.join()) {
        throw new Error(
            `CJS SyncChannel exports differ from ESM: ${cjsSyncChannelKeys.join(', ')}`,
        );
    }
}

function createEntryPackConfig(entry: EntryConfig): PackUserConfig {
    const config: PackUserConfig = {
        entry: { [entry.name]: entry.file },
        deps: {
            // Sibling entry sources must stay external so each emitted entry is a
            // real module — this is what keeps the SyncChannel namespace
            // member-level tree-shakeable for downstream bundlers.
            neverBundle: id => {
                const target = resolveExternalTarget(id);
                return target !== undefined && target !== entry.name;
            },
        },
        outputOptions: (options, format) => ({
            ...options,
            paths: (id: string) => {
                const target = resolveExternalTarget(id);
                if (target === undefined || target === entry.name) return id;

                return `./${target}.${format === 'es' ? 'mjs' : 'cjs'}`;
            },
        }),
    };

    if (entry.name === 'sync') {
        // The `export * as SyncChannel` re-export lives in this entry, so the
        // CJS interop wrapper it emits must be fixed up here.
        config.plugins = [createCjsEntryFixupPlugin(entry)];
    }

    if (entry.name === 'main') {
        // CJS `export *` requires keep source paths (see the fixup plugin).
        config.plugins = [createCjsEntryFixupPlugin(entry)];
        config.hooks = {
            // `main` builds last, so every sibling chunk already exists here.
            'build:done': verifyCjsSyncChannelKeys,
        };
    }

    return config;
}

const sharedPackConfig = {
    format: ['esm', 'cjs'],
    dts: true,
    sourcemap: true,
    target: 'esnext',
    platform: 'browser',
    fixedExtension: true,
    // Entry names are fixed; hashed chunk names would make the cross-entry
    // rewrites above non-deterministic.
    hash: false,
    treeshake: {
        moduleSideEffects: false,
        propertyReadSideEffects: false,
    },
} satisfies PackUserConfig;
// #endregion

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
    pack: [
        // The first config cleans dist/ so the rest build incrementally on top;
        // tsdown builds array configs sequentially in declaration order.
        {
            ...sharedPackConfig,
            entry: { _internal: internalEntryId },
            plugins: [internalEntryPlugin],
            clean: true,
            // The dts pass runs without user plugins, so it cannot resolve the
            // virtual entry. `_internal` ships no public types — see the
            // cross-entry dts check in the verify step.
            dts: false,
        },
        ...entries.map(entry => ({
            ...sharedPackConfig,
            clean: false,
            ...createEntryPackConfig(entry),
        })),
    ],
});
