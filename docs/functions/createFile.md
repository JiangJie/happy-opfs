[**happy-opfs**](../README.md) • **Docs**

***

[happy-opfs](../README.md) / createFile

# Function: createFile()

```ts
function createFile(filePath): AsyncVoidIOResult
```

Creates a new file at the specified path same as `touch`.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `filePath` | `string` | The path of the file to create. |

## Returns

`AsyncVoidIOResult`

A promise that resolves to an `AsyncIOResult` indicating whether the file was successfully created.

## Defined in

[fs/opfs\_core.ts:15](https://github.com/JiangJie/happy-opfs/blob/41bfb9280ee562c4a8708809308f96d116edb112/src/fs/opfs_core.ts#L15)
