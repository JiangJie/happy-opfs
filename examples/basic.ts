/**
 * Basic Usage Example
 *
 * Demonstrates:
 * - Check OPFS support
 * - Create directories
 * - Write and read files
 * - Copy and move files
 * - List directory contents
 * - Remove files and directories
 */

import * as fs from '../src/mod.ts';

const output = document.getElementById('output')!;

function log(message: string, isError = false): void {
    const line = document.createElement('div');
    line.className = isError ? 'error' : 'success';
    line.textContent = message;
    output.appendChild(line);
    console.log(message);
}

async function runExample(): Promise<void> {
    output.textContent = '';

    // 1. Check OPFS support
    log('=== Checking OPFS Support ===');
    if (!fs.isOPFSSupported()) {
        log('OPFS is not supported in this browser!', true);
        return;
    }
    log('✓ OPFS is supported');

    // 2. Clean up from previous runs
    log('\n=== Cleanup ===');
    await fs.remove('/example');
    log('✓ Cleaned up /example directory');

    // 3. Create directory structure (mkdir is recursive by default)
    log('\n=== Creating Directories ===');
    const mkdirResult = await fs.mkdir('/example/data');
    mkdirResult.inspect(() => log('✓ Created /example/data'));
    mkdirResult.inspectErr((err) => log(`✗ Failed to create directory: ${err.message}`, true));

    // 4. Write files
    log('\n=== Writing Files ===');
    const writeResult = await fs.writeFile('/example/data/hello.txt', 'Hello, OPFS!');
    writeResult.inspect(() => log('✓ Wrote /example/data/hello.txt'));
    writeResult.inspectErr((err) => log(`✗ Failed to write file: ${err.message}`, true));

    // Write JSON file
    const jsonResult = await fs.writeJsonFile('/example/data/config.json', {
        name: 'happy-opfs',
        version: '1.0.0',
        features: ['read', 'write', 'zip'],
    });
    jsonResult.inspect(() => log('✓ Wrote /example/data/config.json'));
    jsonResult.inspectErr((err) => log(`✗ Failed to write JSON: ${err.message}`, true));

    // 5. Read files
    log('\n=== Reading Files ===');
    const readResult = await fs.readTextFile('/example/data/hello.txt');
    readResult.inspect((content) => log(`✓ Read hello.txt: "${content}"`));
    readResult.inspectErr((err) => log(`✗ Failed to read file: ${err.message}`, true));

    const jsonReadResult = await fs.readJsonFile<{ name: string; version: string; }>('/example/data/config.json');
    jsonReadResult.inspect((data) => log(`✓ Read config.json: name=${data.name}, version=${data.version}`));
    jsonReadResult.inspectErr((err) => log(`✗ Failed to read JSON: ${err.message}`, true));

    // 6. Copy file
    log('\n=== Copying Files ===');
    const copyResult = await fs.copy('/example/data/hello.txt', '/example/data/backup.txt');
    copyResult.inspect(() => log('✓ Copied hello.txt to backup.txt'));
    copyResult.inspectErr((err) => log(`✗ Failed to copy file: ${err.message}`, true));

    // 7. Move file
    log('\n=== Moving Files ===');
    const moveResult = await fs.move('/example/data/hello.txt', '/example/data/renamed.txt');
    moveResult.inspect(() => log('✓ Moved hello.txt to renamed.txt'));
    moveResult.inspectErr((err) => log(`✗ Failed to move file: ${err.message}`, true));

    // 8. Check if file exists
    log('\n=== Checking Existence ===');
    const existsOldResult = await fs.exists('/example/data/hello.txt');
    existsOldResult.inspect((exists) => log(`✓ hello.txt exists: ${exists}`));

    const existsNewResult = await fs.exists('/example/data/renamed.txt');
    existsNewResult.inspect((exists) => log(`✓ renamed.txt exists: ${exists}`));

    // 9. Get file stats
    log('\n=== File Stats ===');
    const statResult = await fs.stat('/example/data/renamed.txt');
    if (statResult.isOk()) {
        const handle = statResult.unwrap();
        log(`✓ renamed.txt stats:`);
        log(`  - name: ${handle.name}`);
        log(`  - kind: ${handle.kind}`);
        if (fs.isFileHandle(handle)) {
            const file = await handle.getFile();
            log(`  - size: ${file.size} bytes`);
            log(`  - type: ${file.type}`);
        }
    } else {
        log(`✗ Failed to get stats: ${statResult.unwrapErr().message}`, true);
    }

    // 10. List directory contents
    log('\n=== Directory Contents ===');
    const readDirResult = await fs.readDir('/example/data');
    if (readDirResult.isOk()) {
        log(`✓ Contents of /example/data:`);
        for await (const entry of readDirResult.unwrap()) {
            const isFile = fs.isFileHandle(entry.handle);
            log(`  - ${entry.path} (${isFile ? 'file' : 'directory'})`);
        }
    } else {
        log(`✗ Failed to read directory: ${readDirResult.unwrapErr().message}`, true);
    }

    // 11. Append to file
    log('\n=== Appending to File ===');
    const appendResult = await fs.appendFile('/example/data/renamed.txt', '\nAppended text!');
    appendResult.inspect(() => log('✓ Appended to renamed.txt'));
    appendResult.inspectErr((err) => log(`✗ Failed to append: ${err.message}`, true));

    const appendedContent = await fs.readTextFile('/example/data/renamed.txt');
    appendedContent.inspect((content) => log(`✓ New content: "${content}"`));
    appendedContent.inspectErr((err) => log(`✗ Failed to read: ${err.message}`, true));

    // 12. Clean up
    log('\n=== Final Cleanup ===');
    const removeResult = await fs.remove('/example');
    removeResult.inspect(() => log('✓ Removed /example directory'));
    removeResult.inspectErr((err) => log(`✗ Failed to remove: ${err.message}`, true));

    log('\n=== Example Complete ===');
}

document.getElementById('run')!.addEventListener('click', () => {
    runExample().catch((err) => {
        log(`Unexpected error: ${err.message}`, true);
    });
});
