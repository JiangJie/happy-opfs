[**happy-opfs**](../README.md) • **Docs**

***

[happy-opfs](../README.md) / readDir

# Function: readDir()

```ts
function readDir(dirPath, options?): AsyncIOResult<AsyncIterableIterator<ReadDirEntry>>
```

Reads the contents of a directory at the specified path.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `dirPath` | `string` | The path of the directory to read. |
| `options`? | [`ReadDirOptions`](../interfaces/ReadDirOptions.md) | Options of readdir. |

## Returns

`AsyncIOResult`\<`AsyncIterableIterator`\<[`ReadDirEntry`](../interfaces/ReadDirEntry.md)\>\>

A promise that resolves to an `AsyncIOResult` containing an async iterable iterator over the entries of the directory.

## Defined in

[fs/opfs\_core.ts:48](https://github.com/JiangJie/happy-opfs/blob/41bfb9280ee562c4a8708809308f96d116edb112/src/fs/opfs_core.ts#L48)
