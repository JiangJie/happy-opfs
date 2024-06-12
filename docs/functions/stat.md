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
| :------ | :------ | :------ |
| `path` | `string` | The path of the file or directory to retrieve status for. |

## Returns

`AsyncIOResult`\<`FileSystemHandle`\>

A promise that resolves to an `AsyncIOResult` containing the `FileSystemHandle`.

## Source

[fs/opfs\_core.ts:188](https://github.com/JiangJie/happy-opfs/blob/fcbf5b5ef2676cbf90b3a855acdadcf7a79ef72c/src/fs/opfs_core.ts#L188)
