/**
 * Async tests entry point
 */
import * as fs from '../../src/mod.ts';
import { printSummary } from '../test-utils.ts';
import { testCore } from './core.test.ts';
import { testDownloadUpload } from './download-upload.test.ts';
import { testExt } from './ext.test.ts';
import { testStream } from './stream.test.ts';
import { testTemp } from './temp.test.ts';
import { testUtils } from './utils.test.ts';
import { testZip } from './zip.test.ts';

export async function testAsync(): Promise<void> {
    console.log('%c\n========== Starting Async Tests ==========\n', 'color: #6366f1; font-weight: bold; font-size: 14px');

    // Clean up before tests
    await fs.emptyDir(fs.ROOT_DIR);

    // Run all test modules
    await testCore();
    await testExt();
    await testStream();
    await testTemp();
    await testZip();
    await testDownloadUpload();
    await testUtils();

    // Print summary
    printSummary();

    // Clean up after tests
    await fs.remove(fs.ROOT_DIR);
}
