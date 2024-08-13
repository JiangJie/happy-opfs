[**happy-opfs**](../README.md) • **Docs**

***

[happy-opfs](../README.md) / readJsonFile

# Function: readJsonFile()

```ts
function readJsonFile<T>(filePath): AsyncIOResult<T>
```

Reads the content of a file at the specified path as a string and returns it as a JSON object.

## Type Parameters

| Type Parameter |
| ------ |
| `T` |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `filePath` | `string` | The path of the file to read. |

## Returns

`AsyncIOResult`\<`T`\>

A promise that resolves to an `AsyncIOResult` containing the file content as a JSON object.

## Defined in

[fs/opfs\_ext.ts:231](https://github.com/JiangJie/happy-opfs/blob/41bfb9280ee562c4a8708809308f96d116edb112/src/fs/opfs_ext.ts#L231)
