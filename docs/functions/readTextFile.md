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

[fs/opfs\_ext.ts:176](https://github.com/JiangJie/happy-opfs/blob/7bfec3b71684ddcf0fe3092672c66c9664776bcc/src/fs/opfs_ext.ts#L176)
