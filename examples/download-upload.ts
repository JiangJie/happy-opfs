/**
 * Download & Upload Example
 *
 * Demonstrates:
 * - Download files with progress tracking
 * - Cancel downloads
 * - Check downloaded file
 */

import * as fs from '../src/mod.ts';

const output = document.getElementById('output')!;
const progressBar = document.getElementById('progress')!;
const downloadBtn = document.getElementById('download') as HTMLButtonElement;
const cancelBtn = document.getElementById('cancel') as HTMLButtonElement;
const cleanupBtn = document.getElementById('cleanup') as HTMLButtonElement;

let currentTask: ReturnType<typeof fs.downloadFile> | null = null;

function log(message: string, type: 'success' | 'error' | 'info' = 'success'): void {
    const line = document.createElement('div');
    line.className = type;
    line.textContent = message;
    output.appendChild(line);
    console.log(message);
}

function updateProgress(percent: number): void {
    progressBar.style.width = `${percent}%`;
}

async function runDownloadExample(): Promise<void> {
    output.textContent = '';
    updateProgress(0);

    // Check OPFS support
    if (!fs.isOPFSSupported()) {
        log('OPFS is not supported in this browser!', 'error');
        return;
    }

    // Clean up from previous runs
    await fs.remove('/downloads');
    await fs.mkdir('/downloads');

    log('=== Starting Download ===', 'info');

    // Download package.json from this repository
    const url = 'https://raw.githubusercontent.com/JiangJie/happy-opfs/main/package.json';
    const destPath = '/downloads/package.json';

    log(`Downloading from: ${url}`, 'info');
    log(`Saving to: ${destPath}`, 'info');

    downloadBtn.disabled = true;
    cancelBtn.disabled = false;

    currentTask = fs.downloadFile(url, destPath, {
        onProgress(progressResult) {
            progressResult.inspect((progress) => {
                const percent = progress.totalByteLength > 0
                    ? Math.round((progress.completedByteLength / progress.totalByteLength) * 100)
                    : 0;
                updateProgress(percent);
                log(`Progress: ${progress.completedByteLength}/${progress.totalByteLength} bytes (${percent}%)`, 'info');
            });
        },
    });

    const result = await currentTask.response;

    downloadBtn.disabled = false;
    cancelBtn.disabled = true;
    currentTask = null;

    if (result.isOk()) {
        updateProgress(100);
        log('✓ Download complete!', 'success');

        // Verify the downloaded file
        const statResult = await fs.stat(destPath);
        if (statResult.isOk()) {
            const handle = statResult.unwrap();
            if (fs.isFileHandle(handle)) {
                const file = await handle.getFile();
                log(`✓ File size: ${file.size} bytes`, 'success');
            }
        }

        // Read and show a preview
        const content = await fs.readTextFile(destPath);
        content.inspect((text) => {
            const preview = text.length > 200 ? text.substring(0, 200) + '...' : text;
            log(`✓ File preview:\n${preview}`, 'success');
        });
        content.inspectErr((err) => log(`✗ Failed to read file: ${err.message}`, 'error'));

        // List downloaded files
        const files = await fs.readDir('/downloads');
        if (files.isOk()) {
            log('\n=== Downloaded Files ===', 'info');
            for await (const entry of files.unwrap()) {
                log(`  - ${entry.path}`, 'success');
            }
        }
    } else {
        const err = result.unwrapErr();
        if (err.name === 'AbortError') {
            log('Download was cancelled', 'info');
        } else {
            log(`✗ Download failed: ${err.message}`, 'error');
        }
    }
}

function cancelDownload(): void {
    if (currentTask) {
        currentTask.abort();
        log('Cancelling download...', 'info');
    }
}

downloadBtn.addEventListener('click', () => {
    runDownloadExample().catch((err) => {
        log(`Unexpected error: ${err.message}`, 'error');
    });
});

cancelBtn.addEventListener('click', cancelDownload);

cleanupBtn.addEventListener('click', async () => {
    output.textContent = '';
    updateProgress(0);
    log('=== Cleaning Up ===', 'info');
    const result = await fs.remove('/downloads');
    result.inspect(() => log('✓ Removed /downloads directory', 'success'));
    result.inspectErr((err) => log(`✗ Failed to cleanup: ${err.message}`, 'error'));
});
