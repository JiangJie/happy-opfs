[**happy-opfs**](../README.md)

***

[happy-opfs](../README.md) / readBlobFile

# Function: readBlobFile()

```ts
function readBlobFile(filePath): AsyncIOResult<File>
```

Defined in: [fs/opfs\_ext.ts:219](https://github.com/JiangJie/happy-opfs/blob/7d6f4902eef2f34868c7991f5501261a1d1ff67a/src/fs/opfs_ext.ts#L219)

Reads the content of a file at the specified path as a File.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `filePath` | `string` | The path of the file to read. |

## Returns

`AsyncIOResult`\<`File`\>

A promise that resolves to an `AsyncIOResult` containing the file content as a File.
