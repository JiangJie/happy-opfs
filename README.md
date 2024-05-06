<p align="center">
    <a href="README.cn.md">[中文]</a>
</p>

# Use OPFS happily

This is a browser-compatible fs module based on OPFS, which references the [Deno Runtime File_System](https://deno.land/api#File_System) and [Deno @std/fs](https://jsr.io/@std/fs) APIs.

## Installation

Via [JSR](https://jsr.io/@happy-js/happy-opfs) (**recommand**)
```
npx jsr add @happy-js/happy-opfs
```

or just from npm
```
npm install --save happy-opfs
```

## What is OPFS

OPFS stands for [Origin private file system](https://developer.mozilla.org/en-US/docs/Web/API/File_System_API/Origin_private_file_system), which aims to provide a file system API for manipulating local files in the browser environment.

## Why happy-opfs

There are significant differences between the standard OPFS API and familiar file system APIs based on path operations, such as Node.js and Deno. The purpose of this project is to implement an API similar to Deno's in the browser, allowing for convenient file operations.

## Why Reference Deno Instead of Node.js

* The early versions of the Node.js fs API were based on callback syntax, although newer versions support Promise syntax. On the other hand, the Deno fs API was designed from the beginning with Promise syntax. Therefore, Deno has less historical baggage, making it a more suitable choice for implementing a native-compatible API.
* Deno natively supports TypeScript, while Node.js currently does not without the use of additional tools.

## Examples

```ts
import { appendFile, downloadFile, exists, isOPFSSupported, mkdir, readDir, readFile, readTextFile, remove, rename, stat, writeFile } from '@happy-js/happy-opfs';

// Check if OPFS is supported
console.log(`OPFS is${ isOPFSSupported() ? '' : ' not' } supported`);

// Clear all files and folders
await remove('/');
// Recursively create the /happy/opfs directory
await mkdir('/happy/opfs');
// Create and write file content
await writeFile('/happy/opfs/a.txt', 'hello opfs');
// Move the file
await rename('/happy/opfs/a.txt', '/happy/b.txt');
// Append content to the file
await appendFile('/happy/b.txt', ' happy opfs');

// File no longer exists
console.assert((await stat('/happy/opfs/a.txt')).isErr());
console.assert((await readFile('/happy/b.txt')).unwrap().byteLength === 21);
// Automatically normalize the path
console.assert((await readTextFile('//happy///b.txt//')).unwrap() === 'hello opfs happy opfs');

await remove('/happy/opfs');

console.assert(!(await exists('/happy/opfs')).unwrap());
console.assert((await exists('/happy/b.txt')).unwrap());

// Download a file
// Proxy to https://jsr.io/@happy-js/happy-opfs/meta.json by .proxyrc.json
console.assert((await downloadFile('/@happy-js/happy-opfs/meta.json', '/meta.json')).unwrap());

// List all files and folders in the root directory
for await (const [name, handle] of (await readDir('/')).unwrap()) {
    // meta.json is a file
    // happy is a directory
    console.log(`${ name } is a ${ handle.kind }`);
}
```

You can find the above example code in the file `tests/index.ts`, or you can view the runtime effect using the following steps.

```
git clone https://github.com/JiangJie/happy-opfs.git
cd happy-opfs
npm ci
npm start
```

Open [https://localhost:8443/](https://localhost:8443/) in your browser and open the developer tools to observe the console output.

You can also install the [OPFS Explorer](https://chromewebstore.google.com/detail/acndjpgkpaclldomagafnognkcgjignd) browser extension to visually inspect the file system status.