[**happy-opfs**](../README.md) • **Docs**

***

[happy-opfs](../README.md) / writeFile

# Function: writeFile()

```ts
function writeFile(
   filePath, 
   contents, 
options?): AsyncIOResult<boolean>
```

Writes content to a file at the specified path.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `filePath` | `string` | The path of the file to write to. |
| `contents` | [`WriteFileContent`](../type-aliases/WriteFileContent.md) | The content to write to the file. |
| `options`? | [`WriteOptions`](../interfaces/WriteOptions.md) | Optional write options. |

## Returns

`AsyncIOResult`\<`boolean`\>

A promise that resolves to an `AsyncIOResult` indicating whether the file was successfully written.

## Defined in

[fs/opfs\_core.ts:242](https://github.com/JiangJie/happy-opfs/blob/3f62bbf8fdd56458cded8789b78dded5dd27b670/src/fs/opfs_core.ts#L242)
