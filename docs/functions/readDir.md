[**happy-opfs**](../README.md)

***

[happy-opfs](../README.md) / readDir

# Function: readDir()

```ts
function readDir(dirPath, options?): AsyncIOResult<AsyncIterableIterator<ReadDirEntry, any, any>>
```

Defined in: [fs/opfs\_core.ts:48](https://github.com/JiangJie/happy-opfs/blob/318f46cfcd998ebd962bc0e9335ea2aaef290cf7/src/fs/opfs_core.ts#L48)

Reads the contents of a directory at the specified path.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `dirPath` | `string` | The path of the directory to read. |
| `options`? | [`ReadDirOptions`](../interfaces/ReadDirOptions.md) | Options of readdir. |

## Returns

`AsyncIOResult`\<`AsyncIterableIterator`\<[`ReadDirEntry`](../interfaces/ReadDirEntry.md), `any`, `any`\>\>

A promise that resolves to an `AsyncIOResult` containing an async iterable iterator over the entries of the directory.
