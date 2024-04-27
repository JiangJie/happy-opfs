# 快乐地使用 OPFS

这是一套参考 [Deno Runtime File_System](https://deno.land/api#File_System) 和 [Deno @std/fs](https://jsr.io/@std/fs) API，基于 OPFS 实现的浏览器可用的 fs 模块。

## 安装

通过 [JSR](https://jsr.io/@happy-js/happy-opfs) (**推荐**)
```
npx jsr add @happy-js/happy-opfs
```

或者直接使用 npm
```
npm install --save happy-opfs
```

## 什么是 OPFS

OPFS 是 [Origin private file system](https://developer.mozilla.org/en-US/docs/Web/API/File_System_API/Origin_private_file_system) 的简称，旨在为浏览器环境提供一套文件系统 API 来操作本地文件。

## 为什么会有 happy-opfs

标准的 OPFS API 和我们熟知的基于路径操作的文件系统 API 如 Node.js、Deno 存在较大的区别，本项目即是为了实现在浏览器中也能拥有 Deno 一样的 API 方便地操作文件而生。

## 为什么参考 Deno 而不是 Node.js

* 早期的 Node.js fs API 是基于回调的语法，虽然较新的版本支持了 Promise 语法，而 Deno fs API 则一开始就是基于 Promise 语法，这样来说的话，Deno 有更少的历史包袱，要实现和 Native 兼容的 API，选择 Deno 做为参考显然更合适。
* Deno 原生支持 TypeScript，而 Node.js 在不借助于其它工具的情况下暂不支持。

## 示例

```ts
import { appendFile, exists, isOPFSSupported, mkdir, readDir, readFile, readTextFile, remove, rename, stat, writeFile } from '@happy-js/happy-opfs';

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

// List all files and folders in the root directory
for await (const [name, handle] of (await readDir('/')).unwrap()) {
    console.log(`${ name } is a ${ handle.kind }`); // happy is a directory
}
```

以上示例代码可以在文件`tests/index.ts`找到，也可以通过以下方式查看运行时效果。

```
git clone https://github.com/JiangJie/happy-opfs.git
cd happy-opfs
npm ci
npm start
```

通过浏览器打开 [https://localhost:8443/](https://localhost:8443/)，打开开发者工具观察 console 的输出。

你也可以安装 [OPFS Explorer](https://chromewebstore.google.com/detail/acndjpgkpaclldomagafnognkcgjignd) 浏览器扩展，以便直观地查看文件系统状态。