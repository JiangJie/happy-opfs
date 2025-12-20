/**
 * Synchronous API Example
 *
 * Demonstrates:
 * - Connect to sync agent
 * - Synchronous file operations
 * - Compare with async operations
 *
 * Note: Requires SharedArrayBuffer support (COOP/COEP headers)
 */

import {
    connectSyncAgent,
    isSyncAgentConnected,
    mkdirSync,
    writeFileSync,
    readTextFileSync,
    existsSync,
    statSync,
    removeSync,
    isOPFSSupported,
    isFileHandleLike,
} from '../src/mod.ts';

const output = document.getElementById('output')!;

function log(message: string, type: 'success' | 'error' | 'info' | 'warning' = 'success'): void {
    const line = document.createElement('div');
    line.className = type;
    line.textContent = message;
    output.appendChild(line);
    console.log(message);
}

async function runExample(): Promise<void> {
    output.textContent = '';

    // Check OPFS support
    if (!isOPFSSupported()) {
        log('OPFS is not supported in this browser!', 'error');
        return;
    }

    // Check SharedArrayBuffer support
    if (typeof SharedArrayBuffer === 'undefined') {
        log('SharedArrayBuffer is not available!', 'error');
        log('Sync APIs require these HTTP headers:', 'warning');
        log('  Cross-Origin-Opener-Policy: same-origin', 'warning');
        log('  Cross-Origin-Embedder-Policy: require-corp', 'warning');
        return;
    }

    log('=== Connecting to Sync Agent ===', 'info');

    if (isSyncAgentConnected()) {
        log('✓ Already connected to sync agent', 'success');
    } else {
        try {
            // Connect to the sync worker (returns Promise<void>)
            await connectSyncAgent({
                worker: new Worker(new URL('sync-worker.ts', import.meta.url), { type: 'module' }),
                bufferLength: 10 * 1024 * 1024, // 10MB buffer
                opTimeout: 5000, // 5 second timeout
            });

            log('✓ Connected to sync agent', 'success');
        } catch (err) {
            log(`✗ Failed to connect: ${(err as Error).message}`, 'error');
            return;
        }
    }

    // Clean up from previous runs
    log('\n=== Cleanup ===', 'info');
    removeSync('/sync-example');
    log('✓ Cleaned up /sync-example directory', 'success');

    // Synchronous operations
    log('\n=== Synchronous File Operations ===', 'info');

    // Create directory (sync) - mkdir is recursive by default
    log('Creating directory...', 'info');
    const mkdirResult = mkdirSync('/sync-example/data');
    mkdirResult.inspect(() => log('✓ mkdirSync: Created /sync-example/data', 'success'));
    mkdirResult.inspectErr((err) => log(`✗ mkdirSync failed: ${err.message}`, 'error'));

    // Write file (sync)
    log('Writing file...', 'info');
    const writeResult = writeFileSync('/sync-example/data/test.txt', 'Hello from sync API!');
    writeResult.inspect(() => log('✓ writeFileSync: Wrote test.txt', 'success'));
    writeResult.inspectErr((err) => log(`✗ writeFileSync failed: ${err.message}`, 'error'));

    // Check existence (sync)
    log('Checking existence...', 'info');
    const existsResult = existsSync('/sync-example/data/test.txt');
    existsResult.inspect((exists) => log(`✓ existsSync: File exists = ${exists}`, 'success'));
    existsResult.inspectErr((err) => log(`✗ existsSync failed: ${err.message}`, 'error'));

    // Read file (sync)
    log('Reading file...', 'info');
    const readResult = readTextFileSync('/sync-example/data/test.txt');
    readResult.inspect((content) => log(`✓ readTextFileSync: Content = "${content}"`, 'success'));
    readResult.inspectErr((err) => log(`✗ readTextFileSync failed: ${err.message}`, 'error'));

    // Get stats (sync) - returns FileSystemHandleLike
    log('Getting file stats...', 'info');
    const statResult = statSync('/sync-example/data/test.txt');
    statResult.inspect((handleLike) => {
        if (isFileHandleLike(handleLike)) {
            log(`✓ statSync: size=${handleLike.size}, kind=${handleLike.kind}`, 'success');
        } else {
            log(`✓ statSync: kind=${handleLike.kind}`, 'success');
        }
    });
    statResult.inspectErr((err) => log(`✗ statSync failed: ${err.message}`, 'error'));

    // Performance comparison
    log('\n=== Performance Note ===', 'info');
    log('Sync APIs block the main thread and have communication overhead.', 'warning');
    log('Use async APIs when possible for better performance.', 'warning');

    // Clean up
    log('\n=== Final Cleanup ===', 'info');
    const removeResult = removeSync('/sync-example');
    removeResult.inspect(() => log('✓ removeSync: Removed /sync-example', 'success'));
    removeResult.inspectErr((err) => log(`✗ removeSync failed: ${err.message}`, 'error'));

    log('\n=== Example Complete ===', 'info');
}

document.getElementById('run')!.addEventListener('click', () => {
    runExample().catch((err) => {
        log(`Unexpected error: ${err.message}`, 'error');
    });
});
