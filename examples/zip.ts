/**
 * Zip Operations Example
 *
 * Demonstrates:
 * - Create files and directories
 * - Compress directory to zip
 * - Extract zip to directory
 * - List extracted contents
 */

import * as fs from '../src/mod.ts';

const output = document.getElementById('output')!;

function log(message: string, type: 'success' | 'error' | 'info' = 'success'): void {
    const line = document.createElement('div');
    line.className = type;
    line.textContent = message;
    output.appendChild(line);
    console.log(message);
}

async function runExample(): Promise<void> {
    output.textContent = '';

    // Check OPFS support
    if (!fs.isOPFSSupported()) {
        log('OPFS is not supported in this browser!', 'error');
        return;
    }

    // Clean up from previous runs
    log('=== Cleanup ===', 'info');
    await fs.remove('/zip-example');
    await fs.mkdir('/zip-example');
    log('✓ Cleaned up /zip-example directory', 'success');

    // 1. Create source directory with files (mkdir is recursive by default)
    log('\n=== Creating Source Files ===', 'info');

    await fs.mkdir('/zip-example/source/subdir');

    await fs.writeFile('/zip-example/source/readme.txt', 'This is a readme file.\nIt contains multiple lines.');
    log('✓ Created readme.txt', 'success');

    await fs.writeJsonFile('/zip-example/source/data.json', {
        name: 'Test Data',
        items: [1, 2, 3, 4, 5],
        nested: { key: 'value' },
    });
    log('✓ Created data.json', 'success');

    await fs.writeFile('/zip-example/source/subdir/nested.txt', 'This is a nested file.');
    log('✓ Created subdir/nested.txt', 'success');

    // List source files
    log('\n=== Source Directory Contents ===', 'info');
    await listDirectory('/zip-example/source', '  ');

    // 2. Compress to zip
    log('\n=== Compressing ===', 'info');
    const zipResult = await fs.zip('/zip-example/source', '/zip-example/archive.zip');
    zipResult.inspect(() => log('✓ Created archive.zip', 'success'));
    zipResult.inspectErr((err) => log(`✗ Failed to create zip: ${err.message}`, 'error'));

    // Check zip file size
    const zipStat = await fs.stat('/zip-example/archive.zip');
    if (zipStat.isOk()) {
        const handle = zipStat.unwrap();
        if (fs.isFileHandle(handle)) {
            const file = await handle.getFile();
            log(`✓ Zip file size: ${file.size} bytes`, 'success');
        }
    }

    // 3. Extract to new directory
    log('\n=== Extracting ===', 'info');
    const unzipResult = await fs.unzip('/zip-example/archive.zip', '/zip-example/extracted');
    unzipResult.inspect(() => log('✓ Extracted to /zip-example/extracted', 'success'));
    unzipResult.inspectErr((err) => log(`✗ Failed to extract: ${err.message}`, 'error'));

    // 4. List extracted files
    log('\n=== Extracted Directory Contents ===', 'info');
    await listDirectory('/zip-example/extracted', '  ');

    // 5. Verify content
    log('\n=== Verifying Content ===', 'info');

    const originalContent = await fs.readTextFile('/zip-example/source/readme.txt');
    const extractedContent = await fs.readTextFile('/zip-example/extracted/source/readme.txt');

    if (originalContent.isOk() && extractedContent.isOk()) {
        if (originalContent.unwrap() === extractedContent.unwrap()) {
            log('✓ Content verified: readme.txt matches', 'success');
        } else {
            log('✗ Content mismatch: readme.txt differs', 'error');
        }
    }

    const originalJson = await fs.readJsonFile<{ name: string; }>('/zip-example/source/data.json');
    const extractedJson = await fs.readJsonFile<{ name: string; }>('/zip-example/extracted/source/data.json');

    if (originalJson.isOk() && extractedJson.isOk()) {
        if (originalJson.unwrap().name === extractedJson.unwrap().name) {
            log('✓ Content verified: data.json matches', 'success');
        } else {
            log('✗ Content mismatch: data.json differs', 'error');
        }
    }

    log('\n=== Example Complete ===', 'info');
}

async function listDirectory(path: string, indent: string): Promise<void> {
    const result = await fs.readDir(path);
    if (result.isOk()) {
        for await (const entry of result.unwrap()) {
            const isDir = fs.isDirectoryHandle(entry.handle);
            if (isDir) {
                log(`${indent}📁 ${entry.path}/`, 'info');
            } else {
                const stat = await fs.stat(`${path}/${entry.path}`);
                let size = '';
                if (stat.isOk()) {
                    const handle = stat.unwrap();
                    if (fs.isFileHandle(handle)) {
                        const file = await handle.getFile();
                        size = ` (${file.size} bytes)`;
                    }
                }
                log(`${indent}📄 ${entry.path}${size}`, 'success');
            }
        }
    } else {
        log(`${indent}✗ Failed to read: ${result.unwrapErr().message}`, 'error');
    }
}

document.getElementById('run')!.addEventListener('click', () => {
    runExample().catch((err) => {
        log(`Unexpected error: ${err.message}`, 'error');
    });
});

document.getElementById('cleanup')!.addEventListener('click', async () => {
    output.textContent = '';
    log('=== Cleaning Up ===', 'info');
    const result = await fs.remove('/zip-example');
    result.inspect(() => log('✓ Removed /zip-example directory', 'success'));
    result.inspectErr((err) => log(`✗ Failed to cleanup: ${err.message}`, 'error'));
});
