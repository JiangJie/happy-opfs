[**happy-opfs**](../index.md) • **Docs**

***

[happy-opfs](../index.md) / writeFile

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
| :------ | :------ | :------ |
| `filePath` | `string` | The path of the file to write to. |
| `contents` | [`WriteFileContent`](../type-aliases/WriteFileContent.md) | The content to write to the file. |
| `options`? | [`WriteOptions`](../interfaces/WriteOptions.md) | Optional write options. |

## Returns

`AsyncIOResult`\<`boolean`\>

A promise that resolves to an `AsyncIOResult` indicating whether the file was successfully written.

## Source

[fs/opfs\_core.ts:226](https://github.com/JiangJie/happy-opfs/blob/80a97ca3a4288ae6abeed9ee9e10ef7f0d31fc68/src/fs/opfs_core.ts#L226)
