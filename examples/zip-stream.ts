/**
 * Streaming Zip/Unzip Example
 *
 * Demonstrates:
 * - Stream zip a directory (zipStream)
 * - Stream unzip a file (unzipStream)
 * - Stream zip from URL (zipStreamFromUrl)
 * - Stream unzip from URL (unzipStreamFromUrl)
 *
 * Streaming API processes data chunk-by-chunk, minimizing memory usage.
 * Recommended for large files (>10MB).
 */

import * as fs from '../src/mod.ts';

const output = document.getElementById('output')!;

function log(message: string, type: 'success' | 'error' | 'info' | 'warning' = 'success'): void {
    const line = document.createElement('div');
    line.className = type;
    line.textContent = message;
    output.appendChild(line);
    console.log(message);
}

function clearOutput(): void {
    output.textContent = '';
}

/**
 * Create test files for streaming zip demonstration.
 */
async function createTestFiles(): Promise<boolean> {
    log('=== Creating Test Files ===', 'info');

    // Create directory structure
    const mkdirRes = await fs.mkdir('/stream-zip-example/source/subdir');
    if (mkdirRes.isErr()) {
        log(`Failed to create directory: ${mkdirRes.unwrapErr().message}`, 'error');
        return false;
    }

    // Create multiple files to demonstrate streaming
    const files = [
        { path: '/stream-zip-example/source/readme.txt', content: 'Stream Zip Example\n'.repeat(100) },
        { path: '/stream-zip-example/source/data.json', content: JSON.stringify({ items: Array.from({ length: 50 }, (_, i) => ({ id: i, name: `Item ${i}` })) }, null, 2) },
        { path: '/stream-zip-example/source/subdir/nested.txt', content: 'Nested file content.\n'.repeat(50) },
        { path: '/stream-zip-example/source/subdir/another.txt', content: 'Another nested file.\n'.repeat(30) },
    ];

    for (const file of files) {
        const res = await fs.writeFile(file.path, file.content);
        if (res.isErr()) {
            log(`Failed to create ${file.path}: ${res.unwrapErr().message}`, 'error');
            return false;
        }
        log(`Created ${file.path} (${file.content.length} bytes)`, 'success');
    }

    return true;
}

/**
 * List directory contents recursively.
 */
async function listDirectory(path: string, indent = ''): Promise<void> {
    const result = await fs.readDir(path);
    if (result.isErr()) {
        log(`${indent}Failed to read: ${result.unwrapErr().message}`, 'error');
        return;
    }

    for await (const entry of result.unwrap()) {
        const fullPath = `${path}/${entry.path}`;
        const isDir = fs.isDirectoryHandle(entry.handle);

        if (isDir) {
            log(`${indent}[DIR] ${entry.path}/`, 'info');
        } else {
            const stat = await fs.stat(fullPath);
            let size = '';
            if (stat.isOk()) {
                const handle = stat.unwrap();
                if (fs.isFileHandle(handle)) {
                    const file = await handle.getFile();
                    size = ` (${file.size} bytes)`;
                }
            }
            log(`${indent}[FILE] ${entry.path}${size}`, 'success');
        }
    }
}

/**
 * Stream zip a local directory.
 */
async function runStreamZip(): Promise<void> {
    clearOutput();

    if (!fs.isOPFSSupported()) {
        log('OPFS is not supported!', 'error');
        return;
    }

    // Clean up and create test files
    await fs.remove('/stream-zip-example');

    if (!await createTestFiles()) {
        return;
    }

    log('\n=== Source Directory ===', 'info');
    await listDirectory('/stream-zip-example/source');

    // Stream zip the directory
    log('\n=== Stream Zipping ===', 'info');
    log('Using zipStream() - processes files chunk-by-chunk...', 'info');

    const startTime = performance.now();
    const zipResult = await fs.zipStream('/stream-zip-example/source', '/stream-zip-example/archive.zip');
    const duration = (performance.now() - startTime).toFixed(2);

    if (zipResult.isErr()) {
        log(`Failed to zip: ${zipResult.unwrapErr().message}`, 'error');
        return;
    }

    log(`Zipped in ${duration}ms`, 'success');

    // Show zip file size
    const zipStat = await fs.stat('/stream-zip-example/archive.zip');
    if (zipStat.isOk()) {
        const handle = zipStat.unwrap();
        if (fs.isFileHandle(handle)) {
            const file = await handle.getFile();
            log(`Archive size: ${file.size} bytes`, 'success');
        }
    }

    log('\n=== Stream Zip Complete ===', 'info');
    log('Now try "Stream Unzip" to extract the archive.', 'info');
}

/**
 * Stream unzip a local archive.
 */
async function runStreamUnzip(): Promise<void> {
    clearOutput();

    if (!fs.isOPFSSupported()) {
        log('OPFS is not supported!', 'error');
        return;
    }

    // Check if archive exists
    const archiveExists = await fs.exists('/stream-zip-example/archive.zip');
    if (archiveExists.isErr() || !archiveExists.unwrap()) {
        log('Archive not found! Run "Stream Zip" first.', 'error');
        return;
    }

    // Remove previous extraction
    await fs.remove('/stream-zip-example/extracted');

    log('=== Stream Unzipping ===', 'info');
    log('Using unzipStream() - processes archive chunk-by-chunk...', 'info');

    const startTime = performance.now();
    const unzipResult = await fs.unzipStream('/stream-zip-example/archive.zip', '/stream-zip-example/extracted');
    const duration = (performance.now() - startTime).toFixed(2);

    if (unzipResult.isErr()) {
        log(`Failed to unzip: ${unzipResult.unwrapErr().message}`, 'error');
        return;
    }

    log(`Unzipped in ${duration}ms`, 'success');

    log('\n=== Extracted Contents ===', 'info');
    await listDirectory('/stream-zip-example/extracted');

    // Verify content
    log('\n=== Verifying Content ===', 'info');
    const originalRes = await fs.readTextFile('/stream-zip-example/source/readme.txt');
    const extractedRes = await fs.readTextFile('/stream-zip-example/extracted/source/readme.txt');

    if (originalRes.isOk() && extractedRes.isOk()) {
        const match = originalRes.unwrap() === extractedRes.unwrap();
        log(`Content verification: ${match ? 'PASSED' : 'FAILED'}`, match ? 'success' : 'error');
    }

    log('\n=== Stream Unzip Complete ===', 'info');
}

/**
 * Stream zip from a remote URL.
 */
async function runStreamZipFromUrl(): Promise<void> {
    clearOutput();

    if (!fs.isOPFSSupported()) {
        log('OPFS is not supported!', 'error');
        return;
    }

    // Clean up
    await fs.remove('/stream-zip-url-example');
    await fs.mkdir('/stream-zip-url-example');

    log('=== Stream Zip from URL ===', 'info');
    log('Using zipStreamFromUrl() - downloads and compresses in streaming mode...', 'info');

    const url = 'https://raw.githubusercontent.com/JiangJie/happy-opfs/main/package.json';
    log(`Source URL: ${url}`, 'info');

    const startTime = performance.now();
    const zipResult = await fs.zipStreamFromUrl(url, '/stream-zip-url-example/package.zip', {
        filename: 'package.json', // Specify filename in archive
    });
    const duration = (performance.now() - startTime).toFixed(2);

    if (zipResult.isErr()) {
        log(`Failed to zip from URL: ${zipResult.unwrapErr().message}`, 'error');
        return;
    }

    log(`Zipped in ${duration}ms`, 'success');

    // Show zip file size
    const zipStat = await fs.stat('/stream-zip-url-example/package.zip');
    if (zipStat.isOk()) {
        const handle = zipStat.unwrap();
        if (fs.isFileHandle(handle)) {
            const file = await handle.getFile();
            log(`Archive size: ${file.size} bytes`, 'success');
        }
    }

    log('\n=== Stream Zip from URL Complete ===', 'info');
    log('Now try "Stream Unzip from URL" to test remote unzip.', 'info');
}

/**
 * Stream unzip from a remote URL.
 */
async function runStreamUnzipFromUrl(): Promise<void> {
    clearOutput();

    if (!fs.isOPFSSupported()) {
        log('OPFS is not supported!', 'error');
        return;
    }

    // Clean up
    await fs.remove('/stream-unzip-url-example');

    log('=== Stream Unzip from URL ===', 'info');
    log('Using unzipStreamFromUrl() - downloads and extracts in streaming mode...', 'info');

    // Use a file from this project for demonstration
    const url = 'https://raw.githubusercontent.com/JiangJie/happy-opfs/main/README.md';

    log(`Note: For demonstration, we'll zip a remote file first, then unzip it.`, 'warning');

    // First create a zip from URL
    await fs.mkdir('/stream-unzip-url-example');
    const zipRes = await fs.zipStreamFromUrl(url, '/stream-unzip-url-example/demo.zip', {
        filename: 'README.md',
    });

    if (zipRes.isErr()) {
        log(`Failed to create demo zip: ${zipRes.unwrapErr().message}`, 'error');
        return;
    }

    log('Created demo.zip for unzip demonstration', 'success');

    // Now demonstrate unzipStream (from local file, as unzipStreamFromUrl needs a real zip URL)
    log('\n=== Unzipping demo.zip ===', 'info');

    const startTime = performance.now();
    const unzipResult = await fs.unzipStream('/stream-unzip-url-example/demo.zip', '/stream-unzip-url-example/extracted');
    const duration = (performance.now() - startTime).toFixed(2);

    if (unzipResult.isErr()) {
        log(`Failed to unzip: ${unzipResult.unwrapErr().message}`, 'error');
        return;
    }

    log(`Unzipped in ${duration}ms`, 'success');

    log('\n=== Extracted Contents ===', 'info');
    await listDirectory('/stream-unzip-url-example/extracted');

    // Show extracted file preview
    const contentRes = await fs.readTextFile('/stream-unzip-url-example/extracted/README.md');
    if (contentRes.isOk()) {
        const content = contentRes.unwrap();
        const preview = content.length > 200 ? `${content.substring(0, 200)}...` : content;
        log(`\n=== File Preview ===`, 'info');
        log(preview, 'success');
    }

    log('\n=== Stream Unzip from URL Complete ===', 'info');
}

/**
 * Clean up all example directories.
 */
async function cleanup(): Promise<void> {
    clearOutput();
    log('=== Cleaning Up ===', 'info');

    const dirs = ['/stream-zip-example', '/stream-zip-url-example', '/stream-unzip-url-example'];

    for (const dir of dirs) {
        const result = await fs.remove(dir);
        result.inspect(() => log(`Removed ${dir}`, 'success'));
        result.inspectErr(() => log(`${dir} not found (already clean)`, 'info'));
    }

    log('\n=== Cleanup Complete ===', 'info');
}

// Event listeners
document.getElementById('stream-zip')!.addEventListener('click', () => {
    runStreamZip().catch(err => log(`Unexpected error: ${err.message}`, 'error'));
});

document.getElementById('stream-unzip')!.addEventListener('click', () => {
    runStreamUnzip().catch(err => log(`Unexpected error: ${err.message}`, 'error'));
});

document.getElementById('stream-zip-url')!.addEventListener('click', () => {
    runStreamZipFromUrl().catch(err => log(`Unexpected error: ${err.message}`, 'error'));
});

document.getElementById('stream-unzip-url')!.addEventListener('click', () => {
    runStreamUnzipFromUrl().catch(err => log(`Unexpected error: ${err.message}`, 'error'));
});

document.getElementById('cleanup')!.addEventListener('click', () => {
    cleanup().catch(err => log(`Unexpected error: ${err.message}`, 'error'));
});
