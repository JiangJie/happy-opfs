[**happy-opfs**](../README.md) • **Docs**

***

[happy-opfs](../README.md) / appendFile

# Function: appendFile()

```ts
function appendFile(filePath, contents): AsyncVoidIOResult
```

Appends content to a file at the specified path.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `filePath` | `string` | The path of the file to append to. |
| `contents` | [`WriteFileContent`](../type-aliases/WriteFileContent.md) | The content to append to the file. |

## Returns

`AsyncVoidIOResult`

A promise that resolves to an `AsyncIOResult` indicating whether the content was successfully appended.

## Defined in

[fs/opfs\_ext.ts:18](https://github.com/JiangJie/happy-opfs/blob/6253d25d45ee43710777316ce4d92b062d8744f7/src/fs/opfs_ext.ts#L18)
