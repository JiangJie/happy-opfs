import { rm } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, isAbsolute, relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'vite';

interface EntryConfig {
    name: string;
    file: string;
}

interface CjsSyncModule {
    SyncChannel: Record<string, unknown>;
}

// `_internal` only shapes the emitted module graph, so keep it virtual instead
// of adding a source barrel that no source module would import.
const internalEntryId = 'virtual:happy-opfs-internal';
const resolvedInternalEntryId = `\0${ internalEntryId }`;

const entries: readonly EntryConfig[] = [
    { name: 'main', file: 'src/mod.ts' },
    { name: 'async', file: 'src/async/mod.ts' },
    { name: 'shared', file: 'src/shared/mod.ts' },
    { name: 'sync', file: 'src/sync/mod.ts' },
    { name: 'SyncChannel', file: 'src/sync/channel/mod.ts' },
    { name: '_internal', file: internalEntryId },
];

// These modules must have one runtime identity across independent entries.
// In particular, duplicating channel/state.ts would split connect and sync-op state.
const internalEntryFiles = [
    'src/shared/internal/mod.ts',
    'src/sync/channel/state.ts',
    'src/sync/protocol.ts',
] as const;

const rootDir = process.cwd();
const sourceToName = new Map<string, string>(
    entries
        .filter(({ file }) => file.startsWith('src/'))
        .map(({ name, file }) => [normalizePath(resolve(rootDir, file)), name]),
);

const internalSourcePaths = new Set(
    internalEntryFiles.map(file => normalizePath(resolve(rootDir, file))),
);
const sharedInternalDir = `${ normalizePath(resolve(rootDir, 'src/shared/internal')) }/`;

function normalizePath(path: string): string {
    return path.replaceAll('\\', '/');
}

function stripQuery(id: string): string {
    return id.split(/[?#]/, 1)[0] ?? id;
}

function resolveSourcePath(id: string, importer?: string): string | undefined {
    id = stripQuery(id);
    if (!id || id.startsWith('\0')) return undefined;

    if (isAbsolute(id)) return normalizePath(resolve(id));
    if (id.startsWith('src/')) return normalizePath(resolve(rootDir, id));
    if (!id.startsWith('.') || !importer) return undefined;

    importer = stripQuery(importer);
    if (!isAbsolute(importer)) return undefined;

    return normalizePath(resolve(dirname(importer), id));
}

function resolveEntryFromPath(sourcePath: string): string | undefined {
    const exactEntry = sourceToName.get(sourcePath)
        ?? sourceToName.get(`${ sourcePath }.ts`);
    if (exactEntry) return exactEntry;

    if (
        internalSourcePaths.has(sourcePath)
        || internalSourcePaths.has(`${ sourcePath }.ts`)
        || sourcePath.startsWith(sharedInternalDir)
    ) {
        return '_internal';
    }

    return undefined;
}

function resolveEntryFromRawId(id: string): string | undefined {
    const normalized = normalizePath(stripQuery(id));
    if (normalized === internalEntryId || normalized === resolvedInternalEntryId) return '_internal';

    const sourcePath = isAbsolute(normalized)
        ? normalizePath(resolve(normalized))
        : undefined;
    if (sourcePath) {
        const target = resolveEntryFromPath(sourcePath);
        if (target) return target;
    }

    for (const { name, file } of entries) {
        const withoutSrcPrefix = file.startsWith('src/') ? file.slice(4) : file;
        const withoutExtension = withoutSrcPrefix.replace(/\.ts$/, '');
        if (
            normalized.endsWith(`/${file}`)
            || normalized.endsWith(`/${file.replace(/\.ts$/, '')}`)
        ) {
            return name;
        }

        if (withoutSrcPrefix.includes('/')) {
            if (
                normalized.endsWith(`/${withoutSrcPrefix}`)
                || normalized.endsWith(`/${withoutExtension}`)
            ) {
                return name;
            }
        }
        else if (
            normalized === file
            || normalized === file.replace(/\.ts$/, '')
            || normalized === withoutSrcPrefix
            || normalized === withoutExtension
            || normalized === `./${withoutSrcPrefix}`
            || normalized === `./${withoutExtension}`
        ) {
            return name;
        }
    }

    if (
        normalized.includes('/shared/internal/')
        || normalized.endsWith('/sync/protocol.ts')
        || normalized.endsWith('/sync/protocol')
        || normalized.endsWith('/channel/state.ts')
        || normalized.endsWith('/channel/state')
        || normalized === './state.ts'
        || normalized === './state'
        || normalized === '../protocol.ts'
        || normalized === '../protocol'
    ) {
        return '_internal';
    }

    return undefined;
}

// `external` provides an importer, allowing exact path resolution. `output.paths`
// does not, so unresolved source specifiers fall back to the raw-id matching above.
function resolveInternalEntry(id: string, importer?: string): string | undefined {
    const sourcePath = resolveSourcePath(id, importer);
    if (sourcePath) {
        const target = resolveEntryFromPath(sourcePath);
        if (target) return target;
    }

    return resolveEntryFromRawId(id);
}

const externalDependencies: readonly (string | RegExp)[] = [
    /^@std\/path(?:\/|$)/,
    'happy-rusty',
    '@happy-ts/fetch-t',
    'tiny-future',
    'fflate/browser',
];

function isExternalDependency(id: string): boolean {
    return externalDependencies.some(dependency => dependency instanceof RegExp
        ? dependency.test(id)
        : id === dependency || id.startsWith(`${ dependency }/`));
}

// Materialize the private aggregation entry entirely inside the build pipeline.
const internalEntryPlugin = {
    name: 'internal-entry',
    resolveId(id: string): string | undefined {
        return id === internalEntryId ? resolvedInternalEntryId : undefined;
    },
    load(id: string): string | undefined {
        if (id !== resolvedInternalEntryId) return undefined;

        return internalEntryFiles
            .map(file => `export * from ${ JSON.stringify(normalizePath(resolve(rootDir, file))) };`)
            .join('\n');
    },
};

function createCjsEntryFixup(entry: EntryConfig) {
    return {
        name: 'cjs-entry-fixup',
        renderChunk(code: string, chunk: { fileName: string; }): { code: string; map: null; } | null {
            if (!chunk.fileName.endsWith('.cjs')) return null;

            // Rolldown currently keeps original source paths for CJS `export *`
            // instead of applying output.paths.
            let fixed = code;
            for (const target of entries) {
                if (target.name === entry.name || !target.file.startsWith('src/')) continue;

                const relativeSourcePath = normalizePath(relative(dirname(entry.file), target.file));
                const sourcePath = relativeSourcePath.startsWith('.')
                    ? relativeSourcePath
                    : `./${ relativeSourcePath }`;
                const outputPath = `./${ target.name }.cjs`;
                fixed = fixed.replaceAll(`require("${ sourcePath }")`, `require("${ outputPath }")`);
                fixed = fixed.replaceAll(`require('${ sourcePath }')`, `require('${ outputPath }')`);
            }

            // CJS namespace interop adds an enumerable `default` key that the
            // original inlined SyncChannel namespace did not expose. A sibling
            // CJS entry can be used directly without an ESM compatibility wrapper.
            fixed = fixed.replace(
                /let ([\w$]+) = require\((["'])\.\/SyncChannel\.cjs\2\);\n\1 = __toESM\(\1, 1\);/,
                'let $1 = require($2./SyncChannel.cjs$2);',
            );

            return fixed === code ? null : { code: fixed, map: null };
        },
    };
}

await rm('dist', { recursive: true, force: true });

// Build entries separately and externalize cross-entry imports. This preserves
// real module boundaries, including the tree-shakeable SyncChannel namespace.
for (const { name, file } of entries) {
    const isVirtualEntry = file === internalEntryId;

    await build({
        root: rootDir,
        configFile: false,
        plugins: [internalEntryPlugin],
        logLevel: 'warn',
        build: {
            copyPublicDir: false,
            target: 'esnext',
            minify: false,
            sourcemap: true,
            outDir: 'dist',
            emptyOutDir: false,
            // Vite library mode treats its entry as a filesystem path, so the
            // virtual entry goes through Rollup input instead.
            lib: isVirtualEntry
                ? undefined
                : {
                    entry: file,
                },
            rollupOptions: {
                input: isVirtualEntry ? file : undefined,
                // A virtual re-export entry needs strict signatures; otherwise
                // Rolldown may emit an empty `_internal` module.
                preserveEntrySignatures: isVirtualEntry ? 'strict' : undefined,
                plugins: [createCjsEntryFixup({ name, file })],
                external: (id, importer) => {
                    if (isExternalDependency(id)) return true;

                    const target = resolveInternalEntry(id, importer);
                    return target !== undefined && target !== name;
                },
                output: [
                    {
                        format: 'cjs',
                        entryFileNames: `${ name }.cjs`,
                        topLevelVar: false,
                        paths: id => {
                            const target = resolveInternalEntry(id);
                            return target && target !== name ? `./${ target }.cjs` : id;
                        },
                    },
                    {
                        format: 'esm',
                        entryFileNames: `${ name }.mjs`,
                        topLevelVar: false,
                        paths: id => {
                            const target = resolveInternalEntry(id);
                            return target && target !== name ? `./${ target }.mjs` : id;
                        },
                    },
                ],
                treeshake: {
                    moduleSideEffects: false,
                    propertyReadSideEffects: false,
                },
            },
        },
    });
}

// Compare the generated namespaces instead of hard-coding API names. This
// catches CJS interop regressions (such as an enumerable `default`) while API
// additions automatically remain valid when both formats agree.
const cjsSyncModule = createRequire(import.meta.url)(resolve(rootDir, 'dist/sync.cjs')) as CjsSyncModule;
const esmSyncChannelModule = await import(pathToFileURL(resolve(rootDir, 'dist/SyncChannel.mjs')).href);
const cjsSyncChannelKeys = Object.keys(cjsSyncModule.SyncChannel).sort();
const esmSyncChannelKeys = Object.keys(esmSyncChannelModule).sort();
if (cjsSyncChannelKeys.join() !== esmSyncChannelKeys.join()) {
    throw new Error(`CJS SyncChannel exports differ from ESM: ${ cjsSyncChannelKeys.join(', ') }`);
}
