/**
 * Shared Messenger Example - Child Iframe
 *
 * Demonstrates:
 * - Receive shared messenger from parent using setSyncMessenger()
 * - Use sync APIs without calling connectSyncAgent()
 */

import {
    setSyncMessenger,
    isSyncAgentConnected,
    writeFileSync,
    readTextFileSync,
} from '../src/mod.ts';
import { SyncMessenger } from '../src/worker/shared.ts';

const output = document.getElementById('output')!;
const status = document.getElementById('status')!;
const writeBtn = document.getElementById('write') as HTMLButtonElement;
const readBtn = document.getElementById('read') as HTMLButtonElement;

function log(message: string, type: 'success' | 'error' | 'info' = 'success'): void {
    const line = document.createElement('div');
    line.className = type;
    line.textContent = message;
    output.appendChild(line);

    // Also send to parent for unified logging
    window.parent.postMessage({
        type: 'iframe-log',
        message,
        logType: type,
    }, '*');
}

function updateStatus(connected: boolean): void {
    if (connected) {
        status.textContent = 'Connected (shared)';
        status.className = 'connected';
        writeBtn.disabled = false;
        readBtn.disabled = false;
    } else {
        status.textContent = 'Not connected';
        status.className = 'disconnected';
        writeBtn.disabled = true;
        readBtn.disabled = true;
    }
}

// Listen for shared messenger from parent
window.addEventListener('message', (event) => {
    if (event.data.type === 'init-sync-messenger' && event.data.sab) {
        output.textContent = '';
        log('Received SharedArrayBuffer from parent', 'info');

        try {
            // Reconstruct messenger from SharedArrayBuffer
            const messenger = new SyncMessenger(event.data.sab);
            setSyncMessenger(messenger);

            log('Messenger set successfully!', 'success');
            log('Sync APIs are now available', 'success');
            updateStatus(true);
        } catch (err) {
            log(`Failed to set messenger: ${(err as Error).message}`, 'error');
        }
    }
});

// Write file from iframe
writeBtn.addEventListener('click', () => {
    if (!isSyncAgentConnected()) {
        log('Not connected!', 'error');
        return;
    }

    const timestamp = new Date().toISOString();
    const result = writeFileSync('/shared-example/from-iframe.txt', `Written by iframe at ${timestamp}`);

    result.inspect(() => {
        log('Wrote /shared-example/from-iframe.txt', 'success');
    });

    result.inspectErr((err) => {
        log(`Failed to write: ${err.message}`, 'error');
    });
});

// Read file written by main page
readBtn.addEventListener('click', () => {
    if (!isSyncAgentConnected()) {
        log('Not connected!', 'error');
        return;
    }

    const result = readTextFileSync('/shared-example/from-main.txt');

    result.inspect((content) => {
        log(`Read main's file: "${content}"`, 'success');
    });

    result.inspectErr((err) => {
        log(`Failed to read: ${err.message}`, 'error');
    });
});

// Initial status
updateStatus(isSyncAgentConnected());
