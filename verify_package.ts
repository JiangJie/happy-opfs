import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

interface PackageJson {
    name?: string;
    exports?: unknown;
    devDependencies?: Record<string, string>;
}

const PACKAGE_DIR = import.meta.dirname;

// Keep child-process output unchanged; only this script's status lines are colored.
const useColor = process.stdout.isTTY === true && process.env['NO_COLOR'] === undefined;

function colorize(code: number, value: string): string {
    return useColor ? `\u001b[${code}m${value}\u001b[0m` : value;
}

const bold = (value: string): string => colorize(1, value);
const red = (value: string): string => colorize(31, value);
const green = (value: string): string => colorize(32, value);
const cyan = (value: string): string => colorize(36, value);

function ensure(condition: unknown, message: string): asserts condition {
    if (!condition) throw new Error(message);
}

function readPackageJson(path: string): PackageJson {
    return JSON.parse(readFileSync(path, 'utf8')) as PackageJson;
}

function run(command: string, args: string[], cwd = PACKAGE_DIR): void {
    execFileSync(command, args, {
        cwd,
        stdio: ['ignore', 'inherit', 'inherit'],
    });
}

function runCapture(command: string, args: string[], cwd = PACKAGE_DIR): string {
    return execFileSync(command, args, {
        cwd,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'inherit'],
    }).trim();
}

function step(label: string): void {
    console.log(`\n${bold(cyan(`▸ ${label}`))}`);
}

function collectExportTargets(value: unknown, targets: Set<string>): void {
    if (typeof value === 'string') {
        targets.add(value);
        return;
    }

    if (Array.isArray(value)) {
        for (const item of value) collectExportTargets(item, targets);
        return;
    }

    if (value && typeof value === 'object') {
        for (const item of Object.values(value as Record<string, unknown>)) {
            collectExportTargets(item, targets);
        }
    }
}

const packageJson = readPackageJson(join(PACKAGE_DIR, 'package.json'));
// The GitHub Packages workflow rewrites the name before publishing, so derive every
// consumer specifier from the current manifest.
const packageName = packageJson.name;
const typescriptVersion = packageJson.devDependencies?.['typescript'];
ensure(typeof packageName === 'string', 'package.json must define a package name');
ensure(typeof typescriptVersion === 'string', 'package.json must define TypeScript in devDependencies');

const tempDir = mkdtempSync(join(tmpdir(), 'happy-opfs-verify-'));

try {
    step('Packing npm tarball');
    const packDir = join(tempDir, 'pack');
    mkdirSync(packDir, { recursive: true });
    run('pnpm', ['pack', '--pack-destination', packDir]);

    const tarballs = readdirSync(packDir).filter(file => file.endsWith('.tgz'));
    ensure(tarballs.length === 1, `Expected one tarball, found ${tarballs.length}`);
    const tarballPath = join(packDir, tarballs[0]);

    step('Running publint');
    run('pnpm', ['exec', 'publint', tarballPath, '--strict']);

    step('Running Are the Types Wrong');
    run('pnpm', [
        'exec',
        'attw',
        tarballPath,
        '--profile',
        'strict',
        '--no-color',
        '--no-emoji',
    ]);

    step('Installing tarball into a temporary consumer');
    const consumerDir = join(tempDir, 'consumer');
    mkdirSync(consumerDir, { recursive: true });
    writeFileSync(join(consumerDir, 'package.json'), `${JSON.stringify({
        name: 'happy-opfs-package-consumer',
        private: true,
        type: 'module',
        dependencies: {
            [packageName]: `file:${tarballPath}`,
        },
        devDependencies: {
            typescript: typescriptVersion,
        },
    }, null, 2)}\n`);
    run('pnpm', ['install', '--ignore-scripts', '--prefer-offline'], consumerDir);

    const installedPackageDir = join(consumerDir, 'node_modules', packageName);
    ensure(existsSync(installedPackageDir), `Installed package not found: ${installedPackageDir}`);

    step('Verifying packed export targets');
    const installedPackageJson = readPackageJson(join(installedPackageDir, 'package.json'));
    ensure(installedPackageJson.exports != null, 'Packed package must define exports');
    const exportTargets = new Set<string>();
    collectExportTargets(installedPackageJson.exports, exportTargets);
    ensure(exportTargets.size > 0, 'Packed package exports must contain file targets');

    for (const target of exportTargets) {
        ensure(target.startsWith('./'), `Export target must be package-relative: ${target}`);
        ensure(
            existsSync(resolve(installedPackageDir, target)),
            `Packed export target does not exist: ${target}`,
        );
    }
    ensure(!existsSync(join(installedPackageDir, 'src')), 'src/ must not be included in the npm package');

    step('Comparing CJS and ESM runtime exports');
    writeFileSync(join(consumerDir, 'cjs-smoke.cjs'), [
        `const packageNamespace = require(${JSON.stringify(packageName)});`,
        'process.stdout.write(JSON.stringify(Object.keys(packageNamespace).sort()));',
        '',
    ].join('\n'));
    writeFileSync(join(consumerDir, 'esm-smoke.mjs'), [
        `const packageNamespace = await import(${JSON.stringify(packageName)});`,
        'process.stdout.write(JSON.stringify(Object.keys(packageNamespace).sort()));',
        '',
    ].join('\n'));

    const cjsExports = runCapture('node', ['cjs-smoke.cjs'], consumerDir);
    const esmExports = runCapture('node', ['esm-smoke.mjs'], consumerDir);
    ensure(cjsExports === esmExports, `CJS and ESM exports differ:\nCJS: ${cjsExports}\nESM: ${esmExports}`);

    step('Type-checking the package from a bundler consumer');
    writeFileSync(join(consumerDir, 'type-check.ts'), [
        `import * as packageNamespace from ${JSON.stringify(packageName)};`,
        '',
        'void packageNamespace;',
        '',
    ].join('\n'));
    writeFileSync(join(consumerDir, 'tsconfig.json'), `${JSON.stringify({
        compilerOptions: {
            target: 'ESNext',
            module: 'ESNext',
            moduleDetection: 'force',
            moduleResolution: 'bundler',
            lib: ['ESNext', 'DOM', 'DOM.Iterable'],
            strict: true,
            noEmit: true,
            skipLibCheck: false,
        },
        include: ['type-check.ts'],
    }, null, 2)}\n`);
    run('pnpm', ['exec', 'tsc', '--project', 'tsconfig.json'], consumerDir);

    console.log(green(bold('\n✓ All package checks passed')));
}
catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`\n${red(`✗ Package verification failed: ${message}`)}`);
    process.exitCode = 1;
}
finally {
    rmSync(tempDir, { recursive: true, force: true });
}
