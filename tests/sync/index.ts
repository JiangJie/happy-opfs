/**
 * Sync tests entry point
 */
import * as fs from '../../src/mod.ts';
import { printSummary } from '../test-utils.ts';
import { testSyncCore } from './core.test.ts';
import { testSyncExt } from './ext.test.ts';
import { testSyncTemp } from './temp.test.ts';
import { testSyncZip } from './zip.test.ts';

export async function testSync(): Promise<void> {
    console.log('%c\n========== Starting Sync Tests ==========\n', 'color: #6366f1; font-weight: bold; font-size: 14px');

    // Connect sync agent first
    await fs.connectSyncAgent({
        worker: new Worker(new URL('../worker.ts', import.meta.url), {
            type: 'module'
        }),
        bufferLength: 10 * 1024 * 1024,
        opTimeout: 3000,
    });

    // Clean up before tests
    fs.emptyDirSync(fs.ROOT_DIR);

    // Run all test modules
    await testSyncCore();
    await testSyncExt();
    await testSyncTemp();
    await testSyncZip();

    // Print summary
    printSummary();

    // Clean up after tests
    fs.removeSync(fs.ROOT_DIR);
}
