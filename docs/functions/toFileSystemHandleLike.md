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

[fs/utils.ts:8](https://github.com/JiangJie/happy-opfs/blob/ff451a853f34b3dedd716c1414a17eb57f239434/src/fs/utils.ts#L8)
