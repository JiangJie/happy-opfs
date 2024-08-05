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

[fs/opfs\_core.ts:199](https://github.com/JiangJie/happy-opfs/blob/6253d25d45ee43710777316ce4d92b062d8744f7/src/fs/opfs_core.ts#L199)
