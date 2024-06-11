[**happy-opfs**](../index.md) • **Docs**

***

[happy-opfs](../index.md) / readBlobFile

# Function: readBlobFile()

```ts
function readBlobFile(filePath): AsyncIOResult<Blob>
```

Reads the content of a file at the specified path as a Blob.

## Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `filePath` | `string` | The path of the file to read. |

## Returns

`AsyncIOResult`\<`Blob`\>

A promise that resolves to an `AsyncIOResult` containing the file content as a Blob.

## Source

[fs/opfs\_ext.ts:99](https://github.com/JiangJie/happy-opfs/blob/80a97ca3a4288ae6abeed9ee9e10ef7f0d31fc68/src/fs/opfs_ext.ts#L99)
