# 快乐地使用 OPFS

[![NPM version](http://img.shields.io/npm/v/happy-opfs.svg)](https://npmjs.org/package/happy-opfs)
[![JSR Version](https://jsr.io/badges/@happy-js/happy-opfs)](https://jsr.io/@happy-js/happy-opfs)
[![JSR Score](https://jsr.io/badges/@happy-js/happy-opfs/score)](https://jsr.io/@happy-js/happy-opfs/score)

这是一套参考 [Deno Runtime File_System](https://deno.land/api#File_System) 和 [Deno @std/fs](https://jsr.io/@std/fs) API，基于 OPFS 实现的浏览器可用的 fs 模块。

## 安装

```sh
pnpm add happy-opfs
# or
yarn add happy-opfs
# or
npm install --save happy-opfs
# or
jsr add @happy-js/happy-opfs
```

## 什么是 OPFS

OPFS 是 [Origin private file system](https://developer.mozilla.org/en-US/docs/Web/API/File_System_API/Origin_private_file_system) 的简称，旨在为浏览器环境提供一套文件系统 API 来操作本地文件。

## 为什么会有 happy-opfs

标准的 OPFS API 和我们熟知的基于路径操作的文件系统 API 如 Node.js、Deno 存在较大的区别，本项目即是为了实现在浏览器中也能拥有 Deno 一样的 API 方便地操作文件而生。

异步 API 的返回值都是 [Result](https://github.com/JiangJie/happy-rusty) 类型，类似 Rust 的 `Result` 枚举类型，提供更友好的错误处理方式。

## 为什么参考 Deno 而不是 Node.js

-   早期的 Node.js fs API 是基于回调的语法，虽然较新的版本支持了 Promise 语法，而 Deno fs API 则一开始就是基于 Promise 语法，这样来说的话，Deno 有更少的历史包袱，要实现和 Native 兼容的 API，选择 Deno 做为参考显然更合适。
-   Deno 原生支持 TypeScript，而 Node.js 在不借助于其它工具的情况下暂不支持。

## 是否支持同步接口

**支持**

> [!NOTE]
但更推荐使用异步接口，因为主线程并未提供同步接口，为了强制实现同步语法，需要将 I/O 操作移到 `Worker` 进行，同时主线程需要处于阻塞状态，直到 `Worker` 完成 I/O 操作，这显然会带来性能上的损失。

并且由于需要启动 `Worker，同步接口需要在` `Worker` 启动后才能使用，在此之前任何读写都会失败。

**请注意**，为了在主线程和 `Worker` 之间共享数据，需要使用 `SharedArrayBuffer`，为此需要两个额外的 `HTTP Response Header`:
`'Cross-Origin-Opener-Policy': 'same-origin'`
`'Cross-Origin-Embedder-Policy': 'require-corp'`。
否则会报错 `ReferenceError: SharedArrayBuffer is not defined`。

## 示例

```ts
import { appendFile, downloadFile, emptyDir, exists, isFileKind, isOPFSSupported, mkdir, readDir, readFile, readTextFile, remove, rename, ROOT_DIR, stat, toFileSystemHandleLike, unzip, uploadFile, writeFile, zip, type FileSystemFileHandleLike } from 'happy-opfs';

(async () => {
    const mockServer = 'https://16a6dafa-2258-4a83-88fa-31a409e42b17.mock.pstmn.io';
    const mockTodos = `${ mockServer }/todos`;
    const mockTodo1 = `${ mockTodos }/1`;

    // Check if OPFS is supported
    console.log(`OPFS is${ isOPFSSupported() ? '' : ' not' } supported`);

    // Clear all files and folders
    await emptyDir(ROOT_DIR);
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

    console.assert((await readFile('/happy/b.txt')).unwrap().byteLength === 21);
    // Automatically normalize the path
    console.assert((await readTextFile('//happy///b.txt//')).unwrap() === 'hello opfs happy opfs');

    console.assert((await remove('/happy/not/exists')).isOk());
    await remove('/happy/opfs');

    console.assert(!(await exists('/happy/opfs')).unwrap());
    console.assert((await exists('/happy/b.txt')).unwrap());
    console.assert(isFileKind((await stat('/happy/b.txt')).unwrap().kind));

    // Download a file
    const downloadTask = downloadFile(mockSingle, '/todo.json', {
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
        console.assert((await uploadFile('/todo.json', mockAll).response).unwrap() instanceof Response);
    } else {
        console.assert(downloadRes.unwrapErr() instanceof Error);
    }

    // Will create directory
    await emptyDir('/not-exists');

    // Zip/Unzip
    console.assert((await zip('/happy', '/happy.zip')).isOk());
    console.assert((await unzip('/happy.zip', '/happy-2')).isOk());

    // List all files and folders in the root directory
    for await (const { path, handle } of (await readDir(ROOT_DIR, {
        recursive: true,
    })).unwrap()) {
        const handleLike = await toFileSystemHandleLike(handle);
        if (isFileKind(handleLike.kind)) {
            const file = handleLike as FileSystemFileHandleLike;
            console.log(`${ path } is a ${ handleLike.kind }, name = ${ handleLike.name }, type = ${ file.type }, size = ${ file.size }, lastModified = ${ file.lastModified }`);
        } else {
            console.log(`${ path } is a ${ handleLike.kind }, name = ${ handleLike.name }`);
        }
    }

    // Comment this line to view using OPFS Explorer
    await remove(ROOT_DIR);
})();
```

以上示例代码可以在 [tests/async.ts](tests/async.ts) 找到，也可以通过以下方式查看运行时效果。

```
git clone https://github.com/JiangJie/happy-opfs.git
cd happy-opfs
pnpm install
pnpm start
```

通过浏览器打开 [https://localhost:8443/](https://localhost:8443/)，打开开发者工具观察 console 的输出。

你也可以安装 [OPFS Explorer](https://chromewebstore.google.com/detail/acndjpgkpaclldomagafnognkcgjignd) 浏览器扩展，以便直观地查看文件系统状态。

### 同步示例

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

详见 [tests/sync.ts](tests/sync.ts)。

## [文档](docs/README.md)