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

[opfs\_core.ts:30](https://github.com/JiangJie/happy-opfs/blob/7cd01910b3abb83abc0f7edbbf013c47ae6a060f/src/fs/opfs_core.ts#L30)
