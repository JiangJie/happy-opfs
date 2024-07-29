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

via pnpm

```
pnpm add happy-opfs
```

or via yarn

```
yarn add happy-opfs
```

or just from npm

```
npm install --save happy-opfs
```

via JSR

```
jsr add @happy-js/happy-opfs
```

## What is OPFS

OPFS stands for [Origin private file system](https://developer.mozilla.org/en-US/docs/Web/API/File_System_API/Origin_private_file_system), which aims to provide a file system API for manipulating local files in the browser environment.

## Why happy-opfs

There are significant differences between the standard OPFS API and familiar file system APIs based on path operations, such as Node.js and Deno. The purpose of this project is to implement an API similar to Deno's in the browser, allowing for convenient file operations.

The return values of asynchronous APIs are of the [Result](https://github.com/JiangJie/happy-rusty) type, similar to Rust's `Result` enum type, providing a more user-friendly error handling approach.

## Why Reference Deno Instead of Node.js

-   The early versions of the Node.js fs API were based on callback syntax, although newer versions support Promise syntax. On the other hand, the Deno fs API was designed from the beginning with Promise syntax. Therefore, Deno has less historical baggage, making it a more suitable choice for implementing a native-compatible API.
-   Deno natively supports TypeScript, while Node.js currently does not without the use of additional tools.

## Examples

```ts
import { appendFile, downloadFile, emptyDir, exists, isOPFSSupported, mkdir, readDir, readFile, readTextFile, remove, rename, stat, uploadFile, writeFile } from 'happy-opfs';

(async () => {
    const mockServer = 'https://16a6dafa-2258-4a83-88fa-31a409e42b17.mock.pstmn.io';
    const mockTodos = `${ mockServer }/todos`;
    const mockTodo1 = `${ mockTodos }/1`;

    // Check if OPFS is supported
    console.log(`OPFS is${ isOPFSSupported() ? '' : ' not' } supported`);

    // Clear all files and folders
    await emptyDir('/');
    // Recursively create the /happy/opfs directory
    await mkdir('/happy/opfs');
    // Create and write file content
    await writeFile('/happy/opfs/a.txt', 'hello opfs');
    // Move the file
    await rename('/happy/opfs/a.txt', '/happy/b.txt');
    // Append content to the file
    await appendFile('/happy/b.txt', ' happy opfs');

    // File no longer exists
    const statRes = await stat('/happy/opfs/a.txt');
    console.assert(statRes.isErr());
    console.log(statRes.unwrapErr().message);

    console.assert((await readFile('/happy/b.txt')).unwrap().byteLength === 21);
    // Automatically normalize the path
    console.assert((await readTextFile('//happy///b.txt//')).unwrap() === 'hello opfs happy opfs');

    console.assert((await remove('/happy/not/exists')).unwrap());
    await remove('/happy/opfs');

    console.assert(!(await exists('/happy/opfs')).unwrap());
    console.assert((await exists('/happy/b.txt')).unwrap());

    // Download a file
    const downloadTask = downloadFile(mockTodo1, '/todo.json', {
        timeout: 1000,
    });
    const downloadRes = await downloadTask.response;
    if (downloadRes.isOk()) {
        console.assert(downloadRes.unwrap() instanceof Response);

        const postData = (await readTextFile('/todo.json')).unwrap();
        const postJson: {
            id: number;
            title: string;
        } = JSON.parse(postData);
        console.assert(postJson.id === 1);

        // Modify the file
        postJson.title = 'happy-opfs';
        await writeFile('/todo.json', JSON.stringify(postJson));

        // Upload a file
        console.assert((await uploadFile('/todo.json', mockTodos).response).unwrap() instanceof Response);
    } else {
        console.assert(downloadRes.unwrapErr() instanceof Error);
    }

    // Will create directory
    await emptyDir('/not-exists');

    // List all files and folders in the root directory
    for await (const { path, handle } of (await readDir('/', {
        recursive: true,
    })).unwrap()) {
        /**
         * todo.json is a file
         * not-exists is a directory
         * happy is a directory
         * happy/b.txt is a file
         */
        console.log(`${ path } is a ${ handle.kind }`);
    }

    // Comment this line to view using OPFS Explorer
    await remove('/');
})();
```

You can find the above example code in the file `tests/index.ts`, or you can view the runtime effect using the following steps.

```
git clone https://github.com/JiangJie/happy-opfs.git
cd happy-opfs
pnpm install
pnpm start
```

Open [https://localhost:8443/](https://localhost:8443/) in your browser and open the developer tools to observe the console output.

You can also install the [OPFS Explorer](https://chromewebstore.google.com/detail/acndjpgkpaclldomagafnognkcgjignd) browser extension to visually inspect the file system status.

## [Docs](docs/README.md)