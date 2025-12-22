/**
 * Stream Operations Example
 *
 * Demonstrates:
 * - Write file using writable stream
 * - Read file using readable stream
 * - Process data in chunks
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
    await fs.remove('/stream-example');
    await fs.mkdir('/stream-example');
    log('✓ Cleaned up /stream-example directory', 'success');

    // 1. Write file using stream
    log('\n=== Writing File with Stream ===', 'info');

    const filePath = '/stream-example/large-file.txt';
    const streamResult = await fs.writeFileStream(filePath);

    if (streamResult.isErr()) {
        log(`✗ Failed to open write stream: ${streamResult.unwrapErr().message}`, 'error');
        return;
    }

    const writable = streamResult.unwrap();
    const encoder = new TextEncoder();

    // Write multiple chunks
    const chunks = [
        'Line 1: Hello from stream!\n',
        'Line 2: This is written in chunks.\n',
        'Line 3: Streaming is great for large files.\n',
        'Line 4: Each chunk is written separately.\n',
        'Line 5: End of stream content.\n',
    ];

    for (let i = 0; i < chunks.length; i++) {
        await writable.write(encoder.encode(chunks[i]));
        log(`✓ Wrote chunk ${i + 1}/${chunks.length}`, 'success');
    }

    // Close the stream
    await writable.close();
    log('✓ Stream closed', 'success');

    // Check file size
    const statResult = await fs.stat(filePath);
    if (statResult.isOk()) {
        const handle = statResult.unwrap();
        if (fs.isFileHandle(handle)) {
            const file = await handle.getFile();
            log(`✓ Total file size: ${file.size} bytes`, 'success');
        }
    }

    // 2. Read file using stream
    log('\n=== Reading File with Stream ===', 'info');

    const readStreamResult = await fs.readFileStream(filePath);

    if (readStreamResult.isErr()) {
        log(`✗ Failed to open read stream: ${readStreamResult.unwrapErr().message}`, 'error');
        return;
    }

    const readable = readStreamResult.unwrap();
    const reader = readable.getReader();
    const decoder = new TextDecoder();

    let chunkCount = 0;
    let totalBytes = 0;
    let content = '';

    // Read chunks
    while (true) {
        const { done, value } = await reader.read();
        if (done) {
            break;
        }

        chunkCount++;
        totalBytes += value.byteLength;
        content += decoder.decode(value, { stream: true });
        log(`✓ Read chunk ${chunkCount}: ${value.byteLength} bytes`, 'success');
    }

    // Flush decoder
    content += decoder.decode();

    log(`\n✓ Total: ${chunkCount} chunk(s), ${totalBytes} bytes`, 'success');

    // 3. Show content
    log('\n=== File Content ===', 'info');
    log(content, 'success');

    // 4. Demonstrate append mode
    log('\n=== Appending with Stream ===', 'info');

    const appendStreamResult = await fs.writeFileStream(filePath, { append: true });

    if (appendStreamResult.isOk()) {
        const appendWritable = appendStreamResult.unwrap();
        await appendWritable.write(encoder.encode('Line 6: This line was appended!\n'));
        await appendWritable.close();
        log('✓ Appended new line to file', 'success');

        // Read the updated file
        const updatedContent = await fs.readTextFile(filePath);
        updatedContent.inspect((text) => {
            log(`\n=== Updated Content ===`, 'info');
            log(text, 'success');
        });
    }

    log('\n=== Example Complete ===', 'info');
}

document.getElementById('run')!.addEventListener('click', () => {
    runExample().catch((err) => {
        log(`Unexpected error: ${err.message}`, 'error');
    });
});

document.getElementById('cleanup')!.addEventListener('click', async () => {
    output.textContent = '';
    log('=== Cleaning Up ===', 'info');
    const result = await fs.remove('/stream-example');
    result.inspect(() => log('✓ Removed /stream-example directory', 'success'));
    result.inspectErr((err) => log(`✗ Failed to cleanup: ${err.message}`, 'error'));
});
