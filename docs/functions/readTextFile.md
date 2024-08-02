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

[fs/opfs\_ext.ts:114](https://github.com/JiangJie/happy-opfs/blob/948cb3ee1ba6a4ce667d07bda817012e57b50bb8/src/fs/opfs_ext.ts#L114)
