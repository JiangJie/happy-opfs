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

[fs/opfs\_ext.ts:89](https://github.com/JiangJie/happy-opfs/blob/584e221ed8f9c25f1e723b7898a60bc25fe8652b/src/fs/opfs_ext.ts#L89)
