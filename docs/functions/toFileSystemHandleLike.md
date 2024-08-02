[**happy-opfs**](../README.md) • **Docs**

***

[happy-opfs](../README.md) / toFileSystemHandleLike

# Function: toFileSystemHandleLike()

```ts
function toFileSystemHandleLike(handle): Promise<FileSystemHandleLike>
```

Serialize a `FileSystemHandle` to plain object.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `handle` | `FileSystemHandle` | `FileSystemHandle` object. |

## Returns

`Promise`\<[`FileSystemHandleLike`](../interfaces/FileSystemHandleLike.md)\>

Serializable version of FileSystemHandle that is FileSystemHandleLike.

## Defined in

[fs/utils.ts:8](https://github.com/JiangJie/happy-opfs/blob/948cb3ee1ba6a4ce667d07bda817012e57b50bb8/src/fs/utils.ts#L8)
