/**
 * Shared Messenger Example - Main Page
 *
 * Demonstrates:
 * - Connect sync agent in main page
 * - Share messenger to iframe using getSyncMessenger()
 * - Both contexts can use sync APIs with the same worker
 */

import {
    connectSyncAgent,
    isSyncAgentConnected,
    getSyncMessenger,
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

// 1. Connect sync agent
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

    if (isSyncAgentConnected()) {
        log('Already connected', 'info');
        return;
    }

    try {
        await connectSyncAgent({
            worker: new Worker(new URL('sync-worker.ts', import.meta.url), { type: 'module' }),
            bufferLength: 10 * 1024 * 1024,
            opTimeout: 5000,
        });
        log('Connected to sync agent', 'success');

        // Create shared directory
        mkdirSync('/shared-example');
        log('Created /shared-example directory', 'success');
    } catch (err) {
        log(`Failed to connect: ${(err as Error).message}`, 'error');
    }
});

// 2. Share messenger to iframe
document.getElementById('share')!.addEventListener('click', () => {
    if (!isSyncAgentConnected()) {
        log('Not connected! Click "Connect" first', 'error');
        return;
    }

    const messengerOpt = getSyncMessenger();
    if (messengerOpt.isNone()) {
        log('Messenger not available', 'error');
        return;
    }

    const messenger = messengerOpt.unwrap();

    // Send messenger to iframe
    // Note: We send the internal SharedArrayBuffer (from i32a.buffer)
    // The iframe will reconstruct the messenger using setSyncMessenger
    iframe.contentWindow?.postMessage({
        type: 'init-sync-messenger',
        sab: messenger.i32a.buffer, // SharedArrayBuffer can be transferred
    }, '*');

    log('Shared messenger to iframe', 'success');
    log('Iframe can now use sync APIs!', 'info');
});

// 3. Write file from main page
document.getElementById('main-write')!.addEventListener('click', () => {
    if (!isSyncAgentConnected()) {
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
    if (isSyncAgentConnected()) {
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
