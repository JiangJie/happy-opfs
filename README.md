# happy-opfs

[![License](https://img.shields.io/npm/l/happy-opfs.svg)](LICENSE)
[![Build Status](https://github.com/JiangJie/happy-opfs/actions/workflows/test.yml/badge.svg)](https://github.com/JiangJie/happy-opfs/actions/workflows/test.yml)
[![codecov](https://codecov.io/gh/JiangJie/happy-opfs/graph/badge.svg)](https://codecov.io/gh/JiangJie/happy-opfs)
[![NPM version](https://img.shields.io/npm/v/happy-opfs.svg)](https://npmjs.org/package/happy-opfs)
[![NPM downloads](https://badgen.net/npm/dm/happy-opfs)](https://npmjs.org/package/happy-opfs)
[![JSR Version](https://jsr.io/badges/@happy-js/happy-opfs)](https://jsr.io/@happy-js/happy-opfs)
[![JSR Score](https://jsr.io/badges/@happy-js/happy-opfs/score)](https://jsr.io/@happy-js/happy-opfs/score)

A browser file system module based on [OPFS](https://developer.mozilla.org/en-US/docs/Web/API/File_System_API/Origin_private_file_system), providing [Deno](https://deno.land/api#File_System)-style APIs.

---

[中文](README.cn.md) | [API Documentation](https://jiangjie.github.io/happy-opfs/)

---

## Why happy-opfs

The standard OPFS API differs significantly from familiar path-based file system APIs like Node.js and Deno. This library bridges that gap by providing Deno-style APIs in the browser.

All async APIs return [Result](https://github.com/JiangJie/happy-rusty) types (similar to Rust) for better error handling.

## Installation

```sh
pnpm add happy-opfs
# or
npm install happy-opfs
# or
yarn add happy-opfs
# or via JSR
jsr add @happy-js/happy-opfs
```

> [!NOTE]
> This package depends on `@std/path` from JSR. Add this to your `.npmrc`:
> ```
> @jsr:registry=https://npm.jsr.io
> ```

## Features

| Category | APIs |
|----------|------|
| **Core** | `createFile`, `mkdir`, `readDir`, `readFile`, `writeFile`, `remove`, `stat` |
| **Extended** | `appendFile`, `copy`, `move`, `exists`, `emptyDir`, `readTextFile`, `readBlobFile`, `readJsonFile`, `writeJsonFile` |
| **Stream** | `readFileStream`, `writeFileStream` |
| **Temp** | `mkTemp`, `generateTempPath`, `pruneTemp`, `deleteTemp` |
| **Zip** | `zip`, `unzip`, `zipFromUrl`, `unzipFromUrl` |
| **Network** | `downloadFile`, `uploadFile` |
| **Sync** | All core operations have sync versions (e.g., `mkdirSync`, `readFileSync`) via Web Workers. Use `SyncChannel.connect`, `SyncChannel.listen`, `SyncChannel.attach`, `SyncChannel.isReady` for setup |

## Examples

Run examples locally:

```sh
pnpm run eg
# Open https://localhost:5173
```

### Quick Start

```ts
import { mkdir, writeFile, readTextFile, remove } from 'happy-opfs';

// Write and read files
await mkdir('/data');
await writeFile('/data/hello.txt', 'Hello, OPFS!');

(await readTextFile('/data/hello.txt')).inspect((content) => {
    console.log(content); // 'Hello, OPFS!'
});

await remove('/data');
```

See more examples in the [examples/](./examples/) directory:

- [Basic Usage](./examples/basic.ts) - File CRUD operations
- [Download & Upload](./examples/download-upload.ts) - Network operations with progress
- [Zip Operations](./examples/zip.ts) - Compress and extract files
- [Stream Operations](./examples/stream.ts) - Read and write files using streams
- [Sync API](./examples/sync-api.ts) - Synchronous operations via Worker
- [Shared Messenger](./examples/shared-messenger.ts) - Share sync messenger between contexts

## Browser Compatibility

| Browser | Version |
|---------|---------|
| Chrome  | 86+     |
| Edge    | 86+     |
| Firefox | 111+    |
| Safari  | 15.2+   |

For detailed compatibility, see [MDN - OPFS](https://developer.mozilla.org/en-US/docs/Web/API/File_System_API/Origin_private_file_system#browser_compatibility).

You can install [OPFS Explorer](https://chromewebstore.google.com/detail/acndjpgkpaclldomagafnognkcgjignd) to visually inspect the file system.

## Test Coverage

Coverage is collected using V8 provider in real browser environment.

- `src/worker/opfs_worker.ts` is excluded because it runs in Web Worker context where V8 cannot instrument
- `src/fs/core/*.ts` has branches running in Worker context, but fully tested through sync API tests

## License

[MIT](LICENSE)
