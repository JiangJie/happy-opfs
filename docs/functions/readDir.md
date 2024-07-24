[**happy-opfs**](../README.md) • **Docs**

***

[happy-opfs](../README.md) / readDir

# Function: readDir()

```ts
function readDir(dirPath): AsyncIOResult<AsyncIterableIterator<[string, FileSystemHandle]>>
```

Reads the contents of a directory at the specified path.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `dirPath` | `string` | The path of the directory to read. |

## Returns

`AsyncIOResult`\<`AsyncIterableIterator`\<[`string`, `FileSystemHandle`]\>\>

A promise that resolves to an `AsyncIOResult` containing an async iterable iterator over the entries of the directory.

## Defined in

[opfs\_core.ts:30](https://github.com/JiangJie/happy-opfs/blob/fa6bc23a30a47c302610ab09429219f90b89d4ad/src/fs/opfs_core.ts#L30)
