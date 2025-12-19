# Use OPFS happily

[![NPM version](https://img.shields.io/npm/v/happy-opfs.svg)](https://npmjs.org/package/happy-opfs)
[![NPM downloads](https://badgen.net/npm/dm/happy-opfs)](https://npmjs.org/package/happy-opfs)
[![JSR Version](https://jsr.io/badges/@happy-js/happy-opfs)](https://jsr.io/@happy-js/happy-opfs)
[![JSR Score](https://jsr.io/badges/@happy-js/happy-opfs/score)](https://jsr.io/@happy-js/happy-opfs/score)
[![Build Status](https://github.com/JiangJie/happy-opfs/actions/workflows/test.yml/badge.svg)](https://github.com/JiangJie/happy-opfs/actions/workflows/test.yml)
[![codecov](https://codecov.io/gh/JiangJie/happy-opfs/graph/badge.svg)](https://codecov.io/gh/JiangJie/happy-opfs)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

---

## [中文](README.cn.md)

---

This is a browser-compatible fs module based on OPFS, which references the [Deno Runtime File_System](https://deno.land/api#File_System) and [Deno @std/fs](https://jsr.io/@std/fs) APIs.

## Installation

```sh
# via pnpm
pnpm add happy-opfs
# or via yarn
yarn add happy-opfs
# or just from npm
npm install --save happy-opfs
# via JSR
jsr add @happy-js/happy-opfs
```

> [!NOTE]
> This package depends on `@std/path` from JSR. To ensure proper installation, make sure you have a `.npmrc` file in the same directory as your `package.json` with the following line:
>
> ```
> @jsr:registry=https://npm.jsr.io
> ```

## What is OPFS

OPFS stands for [Origin private file system](https://developer.mozilla.org/en-US/docs/Web/API/File_System_API/Origin_private_file_system), which aims to provide a file system API for manipulating local files in the browser environment.

## Why happy-opfs

There are significant differences between the standard OPFS API and familiar file system APIs based on path operations, such as Node.js and Deno. The purpose of this project is to implement an API similar to Deno's in the browser, allowing for convenient file operations.

The return values of asynchronous APIs are of the [Result](https://github.com/JiangJie/happy-rusty) type, similar to Rust's `Result` enum type, providing a more user-friendly error handling approach.

## Why Reference Deno Instead of Node.js

-   The early versions of the Node.js fs API were based on callback syntax, although newer versions support Promise syntax. On the other hand, the Deno fs API was designed from the beginning with Promise syntax. Therefore, Deno has less historical baggage, making it a more suitable choice for implementing a native-compatible API.
-   Deno has native TypeScript support from the start, while Node.js only added type stripping support in version 22+.

## Features

### Core Operations

-   `createFile` - Create an empty file (like `touch`)
-   `mkdir` - Create directories recursively (like `mkdir -p`)
-   `readDir` - Read directory contents with optional recursive traversal
-   `readFile` - Read file contents as ArrayBuffer, string, or Blob
-   `writeFile` - Write content to files with create/append options
-   `remove` - Remove files or directories recursively (like `rm -rf`)
-   `stat` - Get file/directory handle and metadata

### Extended Operations

-   `appendFile` - Append content to existing files
-   `copy` - Copy files or directories (like `cp -r`)
-   `move` - Move/rename files or directories
-   `exists` - Check if a path exists (with isFile/isDirectory options)
-   `emptyDir` - Empty or create a directory
-   `readTextFile` - Read file as UTF-8 string
-   `readBlobFile` - Read file as Blob/File object
-   `readJsonFile` - Read and parse JSON file
-   `writeJsonFile` - Write object as JSON file

### Stream Operations

-   `readFileStream` - Get a `ReadableStream` for reading large files
-   `writeFileStream` - Get a `FileSystemWritableFileStream` for writing large files

### Temporary Files

-   `mkTemp` - Create temporary files or directories
-   `generateTempPath` - Generate a temporary path
-   `pruneTemp` - Clean up expired temporary files
-   `deleteTemp` - Delete all temporary files

### Zip Operations

-   `zip` - Compress files/directories to zip
-   `unzip` - Extract zip archives
-   `zipFromUrl` - Download and create zip from URL
-   `unzipFromUrl` - Download and extract zip from URL

### Download/Upload

-   `downloadFile` - Download files with progress tracking
-   `uploadFile` - Upload files with progress tracking

### Synchronous API

All core operations have synchronous versions (e.g., `mkdirSync`, `readFileSync`, `writeFileSync`) that run via Web Workers.

## Synchronous support

> [!NOTE]
> However, it is more recommended to use the asynchronous interface because the main thread does not provide a synchronous interface. In order to force the implementation of synchronous syntax, the I/O operation needs to be moved to the `Worker`, and the main thread needs to be blocked until the `Worker` completes the I/O operation, which obviously causes performance loss.

And because the `Worker` needs to be started, the synchronous interface can only be used after the `Worker` is started, and any reading and writing before that will fail.

**Please note** that in order to share data between the main thread and the `Worker`, `SharedArrayBuffer` needs to be used, so two additional `HTTP Response Headers` are required for this:
`'Cross-Origin-Opener-Policy': 'same-origin'`
`'Cross-Origin-Embedder-Policy': 'require-corp'`.
Otherwise, an error `ReferenceError: SharedArrayBuffer is not defined` will be thrown.

## Examples

### Basic Usage

```ts
import * as fs from 'happy-opfs';

// Check if OPFS is supported
console.log(`OPFS is${fs.isOPFSSupported() ? '' : ' not'} supported`);

// Create directories
await fs.mkdir('/my/nested/directory');

// Write files
await fs.writeFile('/my/file.txt', 'Hello, OPFS!');
await fs.writeFile('/my/data.bin', new Uint8Array([1, 2, 3, 4, 5]));

// Read files
const textResult = await fs.readTextFile('/my/file.txt');
if (textResult.isOk()) {
    console.log(textResult.unwrap()); // 'Hello, OPFS!'
}

const binaryResult = await fs.readFile('/my/data.bin');
if (binaryResult.isOk()) {
    console.log(new Uint8Array(binaryResult.unwrap())); // [1, 2, 3, 4, 5]
}

// Check existence
const exists = await fs.exists('/my/file.txt');
console.log(exists.unwrap()); // true

// Copy and move
await fs.copy('/my/file.txt', '/my/file-backup.txt');
await fs.move('/my/file.txt', '/my/renamed.txt');

// Remove files/directories
await fs.remove('/my/nested/directory');

// List directory contents
const entries = await fs.readDir('/my', { recursive: true });
if (entries.isOk()) {
    for await (const { path, handle } of entries.unwrap()) {
        console.log(`${path} is a ${handle.kind}`);
    }
}
```

### Stream Operations

```ts
import * as fs from 'happy-opfs';

// Read large files using streams
const streamResult = await fs.readFileStream('/large-file.bin');
if (streamResult.isOk()) {
    const stream = streamResult.unwrap();
    const reader = stream.getReader();
    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        console.log('Received chunk:', value.length, 'bytes');
    }
}

// Write large files using streams
const writeStreamResult = await fs.writeFileStream('/output.bin');
if (writeStreamResult.isOk()) {
    const stream = writeStreamResult.unwrap();
    try {
        await stream.write(new Uint8Array([1, 2, 3]));
        await stream.write(new Uint8Array([4, 5, 6]));
    } finally {
        await stream.close();
    }
}
```

### Download and Upload

```ts
import * as fs from 'happy-opfs';

// Download a file with progress
const downloadTask = fs.downloadFile('https://example.com/file.zip', '/downloads/file.zip', {
    timeout: 30000,
    onProgress(progressResult) {
        progressResult.inspect((progress) => {
            console.log(
                `Downloaded ${progress.completedByteLength}/${progress.totalByteLength} bytes`
            );
        });
    },
});
const downloadRes = await downloadTask.response;

// Upload a file
const uploadTask = fs.uploadFile('/my/file.txt', 'https://example.com/upload');
const uploadRes = await uploadTask.response;
```

### Zip Operations

```ts
import * as fs from 'happy-opfs';

// Compress a directory
await fs.zip('/my/directory', '/archive.zip');

// Extract a zip file
await fs.unzip('/archive.zip', '/extracted');

// Download and extract
await fs.unzipFromUrl('https://example.com/archive.zip', '/from-url');
```

### Temporary Files

```ts
import * as fs from 'happy-opfs';

// Create temporary file
const tempPath = await fs.mkTemp({ extname: '.txt' });
tempPath.inspect((path) => {
    console.log(`Created temp file: ${path}`); // e.g., /tmp/tmp-abc123.txt
});

// Create temporary directory
const tempDir = await fs.mkTemp({ isDirectory: true });

// Clean up old temp files (older than specified date)
const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
await fs.pruneTemp(yesterday);

// Delete all temp files
await fs.deleteTemp();
```

### Synchronous API

`worker.ts`

```ts
import { startSyncAgent } from 'happy-opfs';

startSyncAgent();
```

`index.ts`

```ts
import { connectSyncAgent, mkdirSync, writeFileSync, readTextFileSync } from 'happy-opfs';

await connectSyncAgent({
    worker: new Worker(new URL('worker.ts', import.meta.url), {
        type: 'module',
    }),
    // SharedArrayBuffer size between main thread and worker
    bufferLength: 10 * 1024 * 1024,
    // max wait time at main thread per operation
    opTimeout: 3000,
});

mkdirSync('/happy/opfs');
writeFileSync('/happy/opfs/file.txt', 'Hello sync!');
const content = readTextFileSync('/happy/opfs/file.txt');
console.log(content.unwrap()); // 'Hello sync!'
```

See [tests/sync.test.ts](tests/sync.test.ts) for more details.

## Running Tests

```sh
# Install dependencies
pnpm install

# Install Playwright browsers (required for browser tests)
pnpm run playwright:install

# Run tests
pnpm test

# Run tests in watch mode
pnpm run test:watch

# Run tests with UI
pnpm run test:ui
```

You can also install the [OPFS Explorer](https://chromewebstore.google.com/detail/acndjpgkpaclldomagafnognkcgjignd) browser extension to visually inspect the file system status.

## Test Coverage

Tests are run in a real browser environment using Playwright to ensure OPFS compatibility. Coverage is collected using V8 coverage provider.

**Coverage Notes:**
- `src/worker/opfs_worker.ts` is excluded from coverage reports because it runs in a Web Worker context, and coverage tools cannot collect data from Worker threads in browser tests
- `src/fs/opfs_core.ts` does not reach 100% coverage because the `writeFile` function has a branch that runs in the Worker thread context, which cannot be collected by coverage tools. However, this code path is fully tested through the synchronous API tests
- `src/mod.ts` is excluded as it only contains re-exports
- `src/fs/defines.ts` is excluded as it only contains TypeScript type definitions

Current coverage status can be viewed on [Codecov](https://codecov.io/gh/JiangJie/happy-opfs).

## Browser Compatibility

OPFS is supported in modern browsers:

| Browser | Version |
|---------|--------|
| Chrome | 86+ |
| Edge | 86+ |
| Firefox | 111+ |
| Safari | 15.2+ |

For detailed compatibility information, see [MDN - Origin Private File System](https://developer.mozilla.org/en-US/docs/Web/API/File_System_API/Origin_private_file_system#browser_compatibility).

> [!NOTE]
> Synchronous API requires `SharedArrayBuffer` support, which needs [cross-origin isolation](https://developer.mozilla.org/en-US/docs/Web/API/Window/crossOriginIsolated) headers.

## [Docs](docs/README.md)
