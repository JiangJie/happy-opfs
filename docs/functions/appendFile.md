[**happy-opfs**](../README.md) • **Docs**

***

[happy-opfs](../README.md) / appendFile

# Function: appendFile()

```ts
function appendFile(filePath, contents): AsyncIOResult<boolean>
```

Appends content to a file at the specified path.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `filePath` | `string` | The path of the file to append to. |
| `contents` | [`WriteFileContent`](../type-aliases/WriteFileContent.md) | The content to append to the file. |

## Returns

`AsyncIOResult`\<`boolean`\>

A promise that resolves to an `AsyncIOResult` indicating whether the content was successfully appended.

## Defined in

[fs/opfs\_ext.ts:16](https://github.com/JiangJie/happy-opfs/blob/3f62bbf8fdd56458cded8789b78dded5dd27b670/src/fs/opfs_ext.ts#L16)
