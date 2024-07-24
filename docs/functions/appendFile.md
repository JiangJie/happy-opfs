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

[opfs\_ext.ts:14](https://github.com/JiangJie/happy-opfs/blob/d11d148d6062aa7ef81f55cf9404bf8fd95c760b/src/fs/opfs_ext.ts#L14)
