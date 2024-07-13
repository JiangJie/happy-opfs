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

[opfs\_ext.ts:14](https://github.com/JiangJie/happy-opfs/blob/573f9d2f13523da5aaf43c4022204dc4a870819c/src/fs/opfs_ext.ts#L14)
