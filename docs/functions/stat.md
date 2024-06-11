[**happy-opfs**](../index.md) • **Docs**

***

[happy-opfs](../index.md) / stat

# Function: stat()

```ts
function stat(path): AsyncIOResult<FileSystemHandle>
```

Retrieves the status of a file or directory at the specified path.

## Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `path` | `string` | The path of the file or directory to retrieve status for. |

## Returns

`AsyncIOResult`\<`FileSystemHandle`\>

A promise that resolves to an `AsyncIOResult` containing the `FileSystemHandle`.

## Source

[fs/opfs\_core.ts:188](https://github.com/JiangJie/happy-opfs/blob/80a97ca3a4288ae6abeed9ee9e10ef7f0d31fc68/src/fs/opfs_core.ts#L188)
