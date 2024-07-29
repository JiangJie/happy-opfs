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

[opfs\_ext.ts:101](https://github.com/JiangJie/happy-opfs/blob/3032e80ad2449bcf9084365afada1536627f498f/src/fs/opfs_ext.ts#L101)