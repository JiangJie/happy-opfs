[**happy-opfs**](../README.md) • **Docs**

***

[happy-opfs](../README.md) / readBlobFile

# Function: readBlobFile()

```ts
function readBlobFile(filePath): AsyncIOResult<File>
```

Reads the content of a file at the specified path as a File.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `filePath` | `string` | The path of the file to read. |

## Returns

`AsyncIOResult`\<`File`\>

A promise that resolves to an `AsyncIOResult` containing the file content as a File.

## Defined in

[fs/opfs\_ext.ts:180](https://github.com/JiangJie/happy-opfs/blob/a6314c4612c605f77895adcb9d6d91abcaafaa7d/src/fs/opfs_ext.ts#L180)
