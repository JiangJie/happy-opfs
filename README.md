# Use OPFS happily

[![NPM version](https://img.shields.io/npm/v/happy-opfs.svg)](https://npmjs.org/package/happy-opfs)
[![NPM downloads](https://badgen.net/npm/dm/happy-opfs)](https://npmjs.org/package/happy-opfs)
[![JSR Version](https://jsr.io/badges/@happy-js/happy-opfs)](https://jsr.io/@happy-js/happy-opfs)
[![JSR Score](https://jsr.io/badges/@happy-js/happy-opfs/score)](https://jsr.io/@happy-js/happy-opfs/score)

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
-   Previously, only Deno supported TypeScript natively. Node.js since has implemented type stripping.

## Synchronous support

> [!NOTE]
> However, it is more recommended to use the asynchronous interface because the main thread does not provide a synchronous interface. In order to force the implementation of synchronous syntax, the I/O operation needs to be moved to the `Worker`, and the main thread needs to be blocked until the `Worker` completes the I/O operation, which obviously causes performance loss.

And because the `Worker` needs to be started, the synchronous interface can only be used after the `Worker` is started, and any reading and writing before that will fail.

**Please note** that in order to share data between the main thread and the `Worker`, `SharedArrayBuffer` needs to be used, so two additional `HTTP Response Headers` are required for this:
`'Cross-Origin-Opener-Policy': 'same-origin'`
`'Cross-Origin-Embedder-Policy': 'require-corp'`.
Otherwise, an error `ReferenceError: SharedArrayBuffer is not defined` will be thrown.

## Examples

```ts
import * as fs from 'happy-opfs';

(async () => {
    const mockServer = 'https://16a6dafa-2258-4a83-88fa-31a409e42b17.mock.pstmn.io';
    const mockTodos = `${ mockServer }/todos`;
    const mockTodo1 = `${ mockTodos }/1`;

    // Check if OPFS is supported
    console.log(`OPFS is${ isOPFSSupported() ? '' : ' not' } supported`);

    // Clear all files and folders
    await fs.emptyDir(fs.ROOT_DIR);
    // Recursively create the /happy/opfs directory
    await fs.mkdir('/happy/opfs');
    // Create and write file content
    await fs.writeFile('/happy/opfs/a.txt', 'hello opfs');
    await fs.writeFile('/happy/op-fs/fs.txt', 'hello opfs');
    // Move the file
    await fs.move('/happy/opfs/a.txt', '/happy/b.txt');
    // Append content to the file
    await fs.appendFile('/happy/b.txt', new TextEncoder().encode(' happy opfs'));

    // File no longer exists
    const statRes = await fs.stat('/happy/opfs/a.txt');
    console.assert(statRes.isErr());

    console.assert((await fs.readFile('/happy/b.txt')).unwrap().byteLength === 21);
    // Automatically normalize the path
    console.assert((await fs.readTextFile('//happy///b.txt//')).unwrap() === 'hello opfs happy opfs');

    console.assert((await fs.remove('/happy/not/exists')).isOk());
    console.assert((await fs.remove('/happy/opfs')).isOk());

    console.assert(!(await fs.exists('/happy/opfs')).unwrap());
    console.assert((await fs.exists('/happy/b.txt')).unwrap());
    console.assert(fs.isFileHandle((await fs.stat('/happy/b.txt')).unwrap()));

    // Download a file
    const downloadTask = fs.downloadFile(mockSingle, '/todo.json', {
        timeout: 1000,
        onProgress(progressResult): void {
            progressResult.inspect(progress => {
                console.log(`Downloaded ${ progress.completedByteLength }/${ progress.totalByteLength } bytes`);
            });
        },
    });
    const downloadRes = await downloadTask.response;
    if (downloadRes.isOk()) {
        console.assert(downloadRes.unwrap() instanceof Response);

        const postData = (await fs.readTextFile('/todo.json')).unwrap();
        const postJson: {
            id: number;
            title: string;
        } = JSON.parse(postData);
        console.assert(postJson.id === 1);

        // Modify the file
        postJson.title = 'happy-opfs';
        await fs.writeFile('/todo.json', JSON.stringify(postJson));

        // Upload a file
        console.assert((await fs.uploadFile('/todo.json', mockAll).response).unwrap() instanceof Response);
    } else {
        console.assert(downloadRes.unwrapErr() instanceof Error);
    }

    {
        // Download a file to a temporary file
        const downloadTask = fs.downloadFile(mockSingle);
        const downloadRes = await downloadTask.response;
        downloadRes.inspect(x => {
            console.assert(fs.isTempPath(x.tempFilePath));
            console.assert(x.rawResponse instanceof Response);
        });
        if (downloadRes.isOk()) {
            await fs.remove(downloadRes.unwrap().tempFilePath);
        }
    }

    // Will create directory
    await fs.emptyDir('/not-exists');

    // Zip/Unzip
    console.assert((await fs.zip('/happy', '/happy.zip')).isOk());
    console.assert((await fs.zip('/happy')).unwrap().byteLength === (await fs.readFile('/happy.zip')).unwrap().byteLength);
    console.assert((await fs.unzip('/happy.zip', '/happy-2')).isOk());
    console.assert((await fs.unzipFromUrl(mockZipUrl, '/happy-3', {
        onProgress(progressResult) {
            progressResult.inspect(progress => {
                console.log(`Unzipped ${ progress.completedByteLength }/${ progress.totalByteLength } bytes`);
            });
        },
    })).isOk());
    console.assert((await fs.zipFromUrl(mockZipUrl, '/test-zip.zip')).isOk());
    console.assert((await fs.zipFromUrl(mockZipUrl)).unwrap().byteLength === (await fs.readFile('/test-zip.zip')).unwrap().byteLength);

    // Temp
    console.log(`temp txt file: ${ fs.generateTempPath({
        basename: 'opfs',
        extname: '.txt',
    }) }`);
    console.log(`temp dir: ${ fs.generateTempPath({
        isDirectory: true,
    }) }`);
    (await fs.mkTemp()).inspect(path => {
        console.assert(path.startsWith('/tmp/tmp-'));
    });
    const expired = new Date();
    (await fs.mkTemp({
        basename: 'opfs',
        extname: '.txt',
    })).inspect(path => {
        console.assert(path.startsWith('/tmp/opfs-'));
        console.assert(path.endsWith('.txt'));
    });
    (await fs.mkTemp({
        isDirectory: true,
        basename: '',
    })).inspect(path => {
        console.assert(path.startsWith('/tmp/'));
    });
    console.assert((await Array.fromAsync((await fs.readDir(fs.TMP_DIR)).unwrap())).length === 3);
    await fs.pruneTemp(expired);
    console.assert((await Array.fromAsync((await fs.readDir(fs.TMP_DIR)).unwrap())).length === 2);
    // await fs.deleteTemp();
    // console.assert(!(await fs.exists(fs.TMP_DIR)).unwrap());

    // Copy
    await fs.mkdir('/happy/copy');
    console.assert((await fs.copy('/happy/b.txt', '/happy-2')).isErr());
    console.assert((await fs.copy('/happy', '/happy-copy')).isOk());
    await fs.appendFile('/happy-copy/b.txt', ' copy');
    console.assert((await fs.readFile('/happy-copy/b.txt')).unwrap().byteLength === 26);
    await fs.appendFile('/happy/op-fs/fs.txt', ' copy');
    await fs.copy('/happy', '/happy-copy', {
        overwrite: false,
    });
    console.assert((await fs.readFile('/happy-copy/b.txt')).unwrap().byteLength === 26);

    // List all files and folders in the root directory
    for await (const { path, handle } of (await fs.readDir(fs.ROOT_DIR, {
        recursive: true,
    })).unwrap()) {
        const handleLike = await fs.toFileSystemHandleLike(handle);
        if (fs.isFileHandleLike(handleLike)) {
            console.log(`${ path } is a ${ handleLike.kind }, name = ${ handleLike.name }, type = ${ handleLike.type }, size = ${ handleLike.size }, lastModified = ${ handleLike.lastModified }`);
        } else {
            console.log(`${ path } is a ${ handleLike.kind }, name = ${ handleLike.name }`);
        }
    }

    // Comment this line to view using OPFS Explorer
    await fs.remove(fs.ROOT_DIR);
})();
```

You can find the above example code in the file [tests/async.ts](tests/async.ts), or you can view the runtime effect using the following steps.

```
git clone https://github.com/JiangJie/happy-opfs.git
cd happy-opfs
pnpm install
pnpm start
```

Open [https://localhost:8443/](https://localhost:8443/) in your browser and open the developer tools to observe the console output.

You can also install the [OPFS Explorer](https://chromewebstore.google.com/detail/acndjpgkpaclldomagafnognkcgjignd) browser extension to visually inspect the file system status.

### Synchronization Example

`worker.ts`
```ts
import { startSyncAgent } from 'happy-opfs';

startSyncAgent();
```

`index.ts`
```ts
import { connectSyncAgent, mkdirSync } from 'happy-opfs';

await connectSyncAgent({
    worker: new Worker(new URL('worker.ts', import.meta.url), {
        type: 'module'
    }),
    // SharedArrayBuffer size between main thread and worker
    bufferLength: 10 * 1024 * 1024,
    // max wait time at main thread per operation
    opTimeout: 3000,
});

mkdirSync('/happy/opfs');
// other sync operations
```

See [tests/sync.ts](tests/sync.ts) for details.

## [Docs](docs/README.md)
