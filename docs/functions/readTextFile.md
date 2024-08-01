[**happy-opfs**](../README.md) • **Docs**

***

[happy-opfs](../README.md) / readTextFile

# Function: readTextFile()

```ts
function readTextFile(filePath): AsyncIOResult<string>
```

Reads the content of a file at the specified path as a string.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `filePath` | `string` | The path of the file to read. |

## Returns

`AsyncIOResult`\<`string`\>

A promise that resolves to an `AsyncIOResult` containing the file content as a string.

## Defined in

[fs/opfs\_ext.ts:113](https://github.com/JiangJie/happy-opfs/blob/3f62bbf8fdd56458cded8789b78dded5dd27b670/src/fs/opfs_ext.ts#L113)
