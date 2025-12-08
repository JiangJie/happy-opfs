[**happy-opfs**](../README.md)

***

[happy-opfs](../README.md) / toFileSystemHandleLike

# Function: toFileSystemHandleLike()

```ts
function toFileSystemHandleLike(handle): Promise<FileSystemHandleLike>
```

Defined in: [fs/utils.ts:53](https://github.com/JiangJie/happy-opfs/blob/1ca6e66c9ddde628f35ecf68e910628f2b61ed78/src/fs/utils.ts#L53)

Serialize a `FileSystemHandle` to plain object.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `handle` | `FileSystemHandle` | `FileSystemHandle` object. |

## Returns

`Promise`\<[`FileSystemHandleLike`](../interfaces/FileSystemHandleLike.md)\>

Serializable version of FileSystemHandle that is FileSystemHandleLike.
