# 快乐地使用 OPFS

[![NPM version](https://img.shields.io/npm/v/happy-opfs.svg)](https://npmjs.org/package/happy-opfs)
[![NPM downloads](https://badgen.net/npm/dm/happy-opfs)](https://npmjs.org/package/happy-opfs)
[![JSR Version](https://jsr.io/badges/@happy-js/happy-opfs)](https://jsr.io/@happy-js/happy-opfs)
[![JSR Score](https://jsr.io/badges/@happy-js/happy-opfs/score)](https://jsr.io/@happy-js/happy-opfs/score)
[![Build Status](https://github.com/JiangJie/happy-opfs/actions/workflows/test.yml/badge.svg)](https://github.com/JiangJie/happy-opfs/actions/workflows/test.yml)
[![codecov](https://codecov.io/gh/JiangJie/happy-opfs/graph/badge.svg)](https://codecov.io/gh/JiangJie/happy-opfs)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

## [English](README.md)

---

这是一套参考 [Deno Runtime File_System](https://deno.land/api#File_System) 和 [Deno @std/fs](https://jsr.io/@std/fs) API，基于 OPFS 实现的浏览器可用的 fs 模块。

## 安装

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
> 本项目依赖了从 JSR 安装的 `@std/path` 包。为确保正确安装依赖，需要在 `package.json` 同级目录下创建 `.npmrc` 文件，并添加以下配置：
>
> ```
> @jsr:registry=https://npm.jsr.io
> ```

## 什么是 OPFS

OPFS 是 [Origin private file system](https://developer.mozilla.org/en-US/docs/Web/API/File_System_API/Origin_private_file_system) 的简称，旨在为浏览器环境提供一套文件系统 API 来操作本地文件。

## 为什么会有 happy-opfs

标准的 OPFS API 和我们熟知的基于路径操作的文件系统 API 如 Node.js、Deno 存在较大的区别，本项目即是为了实现在浏览器中也能拥有 Deno 一样的 API 方便地操作文件而生。

异步 API 的返回值都是 [Result](https://github.com/JiangJie/happy-rusty) 类型，类似 Rust 的 `Result` 枚举类型，提供更友好的错误处理方式。

## 为什么参考 Deno 而不是 Node.js

-   早期的 Node.js fs API 是基于回调的语法，虽然较新的版本支持了 Promise 语法，而 Deno fs API 则一开始就是基于 Promise 语法，这样来说的话，Deno 有更少的历史包袱，要实现和 Native 兼容的 API，选择 Deno 做为参考显然更合适。
-   Deno 从一开始就原生支持 TypeScript，而 Node.js 直到 22+ 版本才支持 type stripping。

## 功能特性

### 核心操作

-   `createFile` - 创建空文件（类似 `touch`）
-   `mkdir` - 递归创建目录（类似 `mkdir -p`）
-   `readDir` - 读取目录内容，支持递归遍历
-   `readFile` - 读取文件内容，支持 ArrayBuffer、字符串或 Blob 格式
-   `writeFile` - 写入文件，支持创建/追加选项
-   `remove` - 递归删除文件或目录（类似 `rm -rf`）
-   `stat` - 获取文件/目录句柄和元数据

### 扩展操作

-   `appendFile` - 追加内容到文件
-   `copy` - 复制文件或目录（类似 `cp -r`）
-   `move` - 移动/重命名文件或目录
-   `exists` - 检查路径是否存在（支持 isFile/isDirectory 选项）
-   `emptyDir` - 清空或创建目录
-   `readTextFile` - 以 UTF-8 字符串读取文件
-   `readBlobFile` - 以 Blob/File 对象读取文件
-   `readJsonFile` - 读取并解析 JSON 文件
-   `writeJsonFile` - 将对象写入 JSON 文件

### 流式操作

-   `readFileStream` - 获取 `ReadableStream` 用于读取大文件
-   `writeFileStream` - 获取 `FileSystemWritableFileStream` 用于写入大文件

### 临时文件

-   `mkTemp` - 创建临时文件或目录
-   `generateTempPath` - 生成临时路径
-   `pruneTemp` - 清理过期的临时文件
-   `deleteTemp` - 删除所有临时文件

### Zip 操作

-   `zip` - 压缩文件/目录为 zip
-   `unzip` - 解压 zip 文件
-   `zipFromUrl` - 从 URL 下载并创建 zip
-   `unzipFromUrl` - 从 URL 下载并解压 zip

### 下载/上传

-   `downloadFile` - 下载文件，支持进度跟踪
-   `uploadFile` - 上传文件，支持进度跟踪

### 同步 API

所有核心操作都有同步版本（如 `mkdirSync`、`readFileSync`、`writeFileSync`），通过 Web Workers 实现。

## 是否支持同步接口

**支持**

> [!NOTE]
> 但更推荐使用异步接口，因为主线程并未提供同步接口，为了强制实现同步语法，需要将 I/O 操作移到 `Worker` 进行，同时主线程需要处于阻塞状态，直到 `Worker` 完成 I/O 操作，这显然会带来性能上的损失。

并且由于需要启动 `Worker`，同步接口需要在 `Worker` 启动后才能使用，在此之前任何读写都会失败。

**请注意**，为了在主线程和 `Worker` 之间共享数据，需要使用 `SharedArrayBuffer`，为此需要两个额外的 `HTTP Response Header`:
`'Cross-Origin-Opener-Policy': 'same-origin'`
`'Cross-Origin-Embedder-Policy': 'require-corp'`。
否则会报错 `ReferenceError: SharedArrayBuffer is not defined`。

## 示例

### 基本用法

```ts
import * as fs from 'happy-opfs';

// 检查是否支持 OPFS
console.log(`OPFS ${fs.isOPFSSupported() ? '已' : '未'}支持`);

// 创建目录
await fs.mkdir('/my/nested/directory');

// 写入文件
await fs.writeFile('/my/file.txt', 'Hello, OPFS!');
await fs.writeFile('/my/data.bin', new Uint8Array([1, 2, 3, 4, 5]));

// 读取文件
const textResult = await fs.readTextFile('/my/file.txt');
if (textResult.isOk()) {
    console.log(textResult.unwrap()); // 'Hello, OPFS!'
}

const binaryResult = await fs.readFile('/my/data.bin');
if (binaryResult.isOk()) {
    console.log(new Uint8Array(binaryResult.unwrap())); // [1, 2, 3, 4, 5]
}

// 检查是否存在
const exists = await fs.exists('/my/file.txt');
console.log(exists.unwrap()); // true

// 复制和移动
await fs.copy('/my/file.txt', '/my/file-backup.txt');
await fs.move('/my/file.txt', '/my/renamed.txt');

// 删除文件/目录
await fs.remove('/my/nested/directory');

// 列出目录内容
const entries = await fs.readDir('/my', { recursive: true });
if (entries.isOk()) {
    for await (const { path, handle } of entries.unwrap()) {
        console.log(`${path} 是一个 ${handle.kind}`);
    }
}
```

### 流式操作

```ts
import * as fs from 'happy-opfs';

// 使用流读取大文件
const streamResult = await fs.readFileStream('/large-file.bin');
if (streamResult.isOk()) {
    const stream = streamResult.unwrap();
    const reader = stream.getReader();
    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        console.log('接收到数据块:', value.length, '字节');
    }
}

// 使用流写入大文件
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

### 下载和上传

```ts
import * as fs from 'happy-opfs';

// 下载文件并跟踪进度
const downloadTask = fs.downloadFile('https://example.com/file.zip', '/downloads/file.zip', {
    timeout: 30000,
    onProgress(progressResult) {
        progressResult.inspect((progress) => {
            console.log(`已下载 ${progress.completedByteLength}/${progress.totalByteLength} 字节`);
        });
    },
});
const downloadRes = await downloadTask.response;

// 上传文件
const uploadTask = fs.uploadFile('/my/file.txt', 'https://example.com/upload');
const uploadRes = await uploadTask.response;
```

### Zip 操作

```ts
import * as fs from 'happy-opfs';

// 压缩目录
await fs.zip('/my/directory', '/archive.zip');

// 解压文件
await fs.unzip('/archive.zip', '/extracted');

// 从 URL 下载并解压
await fs.unzipFromUrl('https://example.com/archive.zip', '/from-url');
```

### 临时文件

```ts
import * as fs from 'happy-opfs';

// 创建临时文件
const tempPath = await fs.mkTemp({ extname: '.txt' });
tempPath.inspect((path) => {
    console.log(`创建了临时文件: ${path}`); // 例如：/tmp/tmp-abc123.txt
});

// 创建临时目录
const tempDir = await fs.mkTemp({ isDirectory: true });

// 清理旧的临时文件（早于指定日期）
const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
await fs.pruneTemp(yesterday);

// 删除所有临时文件
await fs.deleteTemp();
```

### 同步示例

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
    // 主线程和 Worker 之间的 SharedArrayBuffer 大小
    bufferLength: 10 * 1024 * 1024,
    // 每次操作在主线程的最大等待时间
    opTimeout: 3000,
});

mkdirSync('/happy/opfs');
writeFileSync('/happy/opfs/file.txt', 'Hello sync!');
const content = readTextFileSync('/happy/opfs/file.txt');
console.log(content.unwrap()); // 'Hello sync!'
```

详见 [tests/sync.test.ts](tests/sync.test.ts)。

## 运行测试

```sh
# 安装依赖
pnpm install

# 安装 Playwright 浏览器（浏览器测试必需）
pnpm run playwright:install

# 运行测试
pnpm test

# 监听模式运行测试
pnpm run test:watch

# 使用 UI 运行测试
pnpm run test:ui
```

你也可以安装 [OPFS Explorer](https://chromewebstore.google.com/detail/acndjpgkpaclldomagafnognkcgjignd) 浏览器扩展，以便直观地查看文件系统状态。

## 测试覆盖率

测试在真实浏览器环境中使用 Playwright 运行，以确保 OPFS 兼容性。覆盖率使用 V8 覆盖率提供程序收集。

**覆盖率说明：**
- `src/worker/opfs_worker.ts` 被排除在覆盖率报告之外，因为它运行在 Web Worker 上下文中，覆盖率工具无法从浏览器测试中的 Worker 线程收集数据
- `src/fs/opfs_core.ts` 未达到 100% 覆盖率，因为 `writeFile` 函数有一个分支是在 Worker 线程中运行的，覆盖率工具无法收集。但该代码路径已通过同步 API 测试完整覆盖
- `src/mod.ts` 被排除，因为它只包含重导出
- `src/fs/defines.ts` 被排除，因为它只包含 TypeScript 类型定义

当前覆盖率状态可在 [Codecov](https://codecov.io/gh/JiangJie/happy-opfs) 查看。

## 浏览器兼容性

OPFS 在现代浏览器中受支持：

| 浏览器 | 版本 |
|--------|------|
| Chrome | 86+ |
| Edge | 86+ |
| Firefox | 111+ |
| Safari | 15.2+ |

详细兼容性信息请参阅 [MDN - Origin Private File System](https://developer.mozilla.org/en-US/docs/Web/API/File_System_API/Origin_private_file_system#browser_compatibility)。

> [!NOTE]
> 同步 API 需要 `SharedArrayBuffer` 支持，这要求设置[跨域隔离](https://developer.mozilla.org/zh-CN/docs/Web/API/Window/crossOriginIsolated)响应头。

## [文档](docs/README.md)
