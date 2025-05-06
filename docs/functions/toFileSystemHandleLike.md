[**happy-opfs**](../README.md)

***

[happy-opfs](../README.md) / toFileSystemHandleLike

# Function: toFileSystemHandleLike()

```ts
function toFileSystemHandleLike(handle): Promise<FileSystemHandleLike>
```

Defined in: [fs/utils.ts:39](https://github.com/JiangJie/happy-opfs/blob/7d6f4902eef2f34868c7991f5501261a1d1ff67a/src/fs/utils.ts#L39)

Serialize a `FileSystemHandle` to plain object.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `handle` | `FileSystemHandle` | `FileSystemHandle` object. |

## Returns

`Promise`\<[`FileSystemHandleLike`](../interfaces/FileSystemHandleLike.md)\>

Serializable version of FileSystemHandle that is FileSystemHandleLike.
