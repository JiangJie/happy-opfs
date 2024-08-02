[**happy-opfs**](../README.md) • **Docs**

***

[happy-opfs](../README.md) / readBlobFile

# Function: readBlobFile()

```ts
function readBlobFile(filePath): AsyncIOResult<Blob>
```

Reads the content of a file at the specified path as a Blob.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `filePath` | `string` | The path of the file to read. |

## Returns

`AsyncIOResult`\<`Blob`\>

A promise that resolves to an `AsyncIOResult` containing the file content as a Blob.

## Defined in

[fs/opfs\_ext.ts:102](https://github.com/JiangJie/happy-opfs/blob/e9fb685299dadc4e6e669ad2019dbf147a8f564a/src/fs/opfs_ext.ts#L102)
