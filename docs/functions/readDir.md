[**happy-opfs**](../index.md) • **Docs**

***

[happy-opfs](../index.md) / readDir

# Function: readDir()

```ts
function readDir(dirPath): AsyncIOResult<AsyncIterableIterator<[string, FileSystemHandle]>>
```

Reads the contents of a directory at the specified path.

## Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `dirPath` | `string` | The path of the directory to read. |

## Returns

`AsyncIOResult`\<`AsyncIterableIterator`\<[`string`, `FileSystemHandle`]\>\>

A promise that resolves to an `AsyncIOResult` containing an async iterable iterator over the entries of the directory.

## Source

[fs/opfs\_core.ts:30](https://github.com/JiangJie/happy-opfs/blob/80a97ca3a4288ae6abeed9ee9e10ef7f0d31fc68/src/fs/opfs_core.ts#L30)
