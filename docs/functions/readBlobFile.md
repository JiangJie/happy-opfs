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

[opfs\_ext.ts:101](https://github.com/JiangJie/happy-opfs/blob/0955d4be7b0440a9e0261193bc3c402389d8f518/src/fs/opfs_ext.ts#L101)
