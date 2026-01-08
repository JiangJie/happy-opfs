# happy-opfs

[![License](https://img.shields.io/npm/l/happy-opfs.svg)](LICENSE)
[![Build Status](https://github.com/JiangJie/happy-opfs/actions/workflows/test.yml/badge.svg)](https://github.com/JiangJie/happy-opfs/actions/workflows/test.yml)
[![codecov](https://codecov.io/gh/JiangJie/happy-opfs/graph/badge.svg)](https://codecov.io/gh/JiangJie/happy-opfs)
[![NPM version](https://img.shields.io/npm/v/happy-opfs.svg)](https://npmjs.org/package/happy-opfs)
[![NPM downloads](https://badgen.net/npm/dm/happy-opfs)](https://npmjs.org/package/happy-opfs)
[![JSR Version](https://jsr.io/badges/@happy-js/happy-opfs)](https://jsr.io/@happy-js/happy-opfs)
[![JSR Score](https://jsr.io/badges/@happy-js/happy-opfs/score)](https://jsr.io/@happy-js/happy-opfs/score)

基于 [OPFS](https://developer.mozilla.org/zh-CN/docs/Web/API/File_System_API/Origin_private_file_system) 的浏览器文件系统模块，提供 [Deno](https://deno.land/api#File_System) 风格的 API。

---

[English](README.md) | [API 文档](https://jiangjie.github.io/happy-opfs/)

---

## 为什么选择 happy-opfs

标准的 OPFS API 与我们熟悉的基于路径的文件系统 API（如 Node.js 和 Deno）差异较大。本库通过在浏览器中提供 Deno 风格的 API 来弥合这一差距。

所有异步 API 返回 [Result](https://github.com/JiangJie/happy-rusty) 类型（类似 Rust），提供更好的错误处理体验。

## 安装

```sh
pnpm add happy-opfs
# 或
npm install happy-opfs
# 或
yarn add happy-opfs
# 或通过 JSR
jsr add @happy-js/happy-opfs
```

> [!NOTE]
> 本项目依赖 JSR 的 `@std/path`，需要在 `.npmrc` 中添加：
> ```
> @jsr:registry=https://npm.jsr.io
> ```

## 功能

| 分类 | API |
|------|-----|
| **核心** | `createFile`, `mkdir`, `readDir`, `readFile`, `writeFile`, `remove`, `stat` |
| **扩展** | `appendFile`, `copy`, `move`, `exists`, `emptyDir`, `readTextFile`, `readBlobFile`, `readJsonFile`, `writeJsonFile` |
| **流式** | `readFileStream`, `writeFileStream` |
| **临时文件** | `mkTemp`, `generateTempPath`, `pruneTemp`, `deleteTemp` |
| **压缩** | `zip`, `unzip`, `zipFromUrl`, `unzipFromUrl` |
| **网络** | `downloadFile`, `uploadFile` |
| **同步** | 所有核心操作都有同步版本（如 `mkdirSync`, `readFileSync`），通过 Web Workers 实现。使用 `connectSyncAgent`, `isSyncAgentConnected`, `getSyncMessenger`, `setSyncMessenger` 进行设置 |

## 示例

本地运行示例：

```sh
pnpm run eg
# 打开 https://localhost:5173
```

### 快速开始

```ts
import { mkdir, writeFile, readTextFile, remove } from 'happy-opfs';

// 写入和读取文件
await mkdir('/data');
await writeFile('/data/hello.txt', 'Hello, OPFS!');

(await readTextFile('/data/hello.txt')).inspect((content) => {
    console.log(content); // 'Hello, OPFS!'
});

await remove('/data');
```

更多示例请参阅 [examples/](./examples/) 目录：

- [基本用法](./examples/basic.ts) - 文件 CRUD 操作
- [下载和上传](./examples/download-upload.ts) - 带进度的网络操作
- [压缩操作](./examples/zip.ts) - 压缩和解压文件
- [流式操作](./examples/stream.ts) - 使用流读写文件
- [同步 API](./examples/sync-api.ts) - 通过 Worker 实现的同步操作
- [共享 Messenger](./examples/shared-messenger.ts) - 在不同上下文间共享同步实例

## 浏览器兼容性

| 浏览器 | 版本 |
|--------|------|
| Chrome | 86+  |
| Edge   | 86+  |
| Firefox| 111+ |
| Safari | 15.2+|

详细兼容性信息请参阅 [MDN - OPFS](https://developer.mozilla.org/zh-CN/docs/Web/API/File_System_API/Origin_private_file_system#browser_compatibility)。

可以安装 [OPFS Explorer](https://chromewebstore.google.com/detail/acndjpgkpaclldomagafnognkcgjignd) 来可视化查看文件系统。

## 测试覆盖率

覆盖率在真实浏览器环境中使用 V8 provider 收集。

- `src/worker/opfs_worker.ts` 被排除，因为它运行在 Web Worker 上下文中，V8 无法对其插桩
- `src/fs/core/*.ts` 有部分分支在 Worker 上下文中运行，但已通过同步 API 测试完整覆盖

## 许可证

[MIT](LICENSE)
