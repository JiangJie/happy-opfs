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

[fs/utils.ts:39](https://github.com/JiangJie/happy-opfs/blob/41bfb9280ee562c4a8708809308f96d116edb112/src/fs/utils.ts#L39)
