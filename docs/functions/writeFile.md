[**happy-opfs**](../README.md) • **Docs**

***

[happy-opfs](../README.md) / writeFile

# Function: writeFile()

```ts
function writeFile(
   filePath, 
   contents, 
   options?): AsyncVoidIOResult
```

Writes content to a file at the specified path.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `filePath` | `string` | The path of the file to write to. |
| `contents` | [`WriteFileContent`](../type-aliases/WriteFileContent.md) | The content to write to the file. |
| `options`? | [`WriteOptions`](../interfaces/WriteOptions.md) | Optional write options. |

## Returns

`AsyncVoidIOResult`

A promise that resolves to an `AsyncIOResult` indicating whether the file was successfully written.

## Defined in

[fs/opfs\_core.ts:256](https://github.com/JiangJie/happy-opfs/blob/a6314c4612c605f77895adcb9d6d91abcaafaa7d/src/fs/opfs_core.ts#L256)
