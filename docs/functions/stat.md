[**happy-opfs**](../README.md) • **Docs**

***

[happy-opfs](../README.md) / stat

# Function: stat()

```ts
function stat(path): AsyncIOResult<FileSystemHandle>
```

Retrieves the status of a file or directory at the specified path.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `path` | `string` | The path of the file or directory to retrieve status for. |

## Returns

`AsyncIOResult`\<`FileSystemHandle`\>

A promise that resolves to an `AsyncIOResult` containing the `FileSystemHandle`.

## Defined in

[opfs\_core.ts:188](https://github.com/JiangJie/happy-opfs/blob/dc95a422852928393060b63cb34de24c88ad98b4/src/fs/opfs_core.ts#L188)
