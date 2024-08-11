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

[fs/utils.ts:39](https://github.com/JiangJie/happy-opfs/blob/7bfec3b71684ddcf0fe3092672c66c9664776bcc/src/fs/utils.ts#L39)
