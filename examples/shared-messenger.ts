/**
 * Shared Messenger Example - Main Page
 *
 * Demonstrates:
 * - Connect sync channel in main page
 * - Share SharedArrayBuffer to iframe
 * - Both contexts can use sync APIs with the same worker
 */

import {
    SyncChannel,
    mkdirSync,
    writeFileSync,
    readTextFileSync,
    removeSync,
    isOPFSSupported,
} from '../src/mod.ts';

const mainOutput = document.getElementById('main-output')!;
const iframe = document.getElementById('child-frame') as HTMLIFrameElement;

function log(message: string, type: 'success' | 'error' | 'info' | 'warning' = 'success'): void {
    const line = document.createElement('div');
    line.className = type;
    line.textContent = `[Main] ${message}`;
    mainOutput.appendChild(line);
    console.log(`[Main] ${message}`);
}

// Store the SharedArrayBuffer for sharing
let sharedBuffer: SharedArrayBuffer | null = null;

// 1. Connect sync channel
document.getElementById('connect')!.addEventListener('click', async () => {
    mainOutput.textContent = '';

    if (!isOPFSSupported()) {
        log('OPFS is not supported!', 'error');
        return;
    }

    if (typeof SharedArrayBuffer === 'undefined') {
        log('SharedArrayBuffer is not available!', 'error');
        log('Requires COOP/COEP headers', 'warning');
        return;
    }

    if (SyncChannel.isReady()) {
        log('Already connected', 'info');
        return;
    }

    const connectRes = await SyncChannel.connect(
        new Worker(new URL('sync-worker.ts', import.meta.url), { type: 'module' }),
        {
            sharedBufferLength: 10 * 1024 * 1024,
            opTimeout: 5000,
        },
    );

    if (connectRes.isErr()) {
        log(`Failed to connect: ${connectRes.unwrapErr().message}`, 'error');
        return;
    }

    sharedBuffer = connectRes.unwrap();
    log('Connected to sync channel', 'success');

    // Create shared directory
    mkdirSync('/shared-example');
    log('Created /shared-example directory', 'success');
});

// 2. Share SharedArrayBuffer to iframe
document.getElementById('share')!.addEventListener('click', () => {
    if (!SyncChannel.isReady() || !sharedBuffer) {
        log('Not connected! Click "Connect" first', 'error');
        return;
    }

    // Send SharedArrayBuffer to iframe
    iframe.contentWindow?.postMessage({
        type: 'init-sync-channel',
        sharedBuffer,
    }, '*');

    log('Shared SharedArrayBuffer to iframe', 'success');
    log('Iframe can now use sync APIs!', 'info');
});

// 3. Write file from main page
document.getElementById('main-write')!.addEventListener('click', () => {
    if (!SyncChannel.isReady()) {
        log('Not connected! Click "Connect" first', 'error');
        return;
    }

    const timestamp = new Date().toISOString();
    const result = writeFileSync('/shared-example/from-main.txt', `Written by main page at ${timestamp}`);

    result.inspect(() => {
        log('Wrote /shared-example/from-main.txt', 'success');

        // Try to read file written by iframe
        const iframeFile = readTextFileSync('/shared-example/from-iframe.txt');
        iframeFile.inspect((content) => {
            log(`Read iframe's file: "${content}"`, 'info');
        });
        iframeFile.inspectErr(() => {
            log('Iframe has not written yet', 'info');
        });
    });

    result.inspectErr((err) => {
        log(`Failed to write: ${err.message}`, 'error');
    });
});

// Cleanup
document.getElementById('cleanup')!.addEventListener('click', () => {
    mainOutput.textContent = '';
    if (SyncChannel.isReady()) {
        const result = removeSync('/shared-example');
        result.inspect(() => log('Cleaned up /shared-example', 'success'));
        result.inspectErr((err) => log(`Failed to cleanup: ${err.message}`, 'error'));
    } else {
        log('Not connected', 'info');
    }
});

// Listen for messages from iframe
window.addEventListener('message', (event) => {
    if (event.data.type === 'iframe-log') {
        const line = document.createElement('div');
        line.className = event.data.logType || 'info';
        line.textContent = `[Iframe] ${event.data.message}`;
        mainOutput.appendChild(line);
    }
});
