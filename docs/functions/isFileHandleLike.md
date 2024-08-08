[**happy-opfs**](../README.md) • **Docs**

***

[happy-opfs](../README.md) / isFileHandleLike

# Function: isFileHandleLike()

```ts
function isFileHandleLike(handle): handle is FileSystemFileHandleLike
```

Whether the handle is a file-like.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `handle` | [`FileSystemHandleLike`](../interfaces/FileSystemHandleLike.md) | The handle which is a FileSystemHandleLike. |

## Returns

`handle is FileSystemFileHandleLike`

`true` if the handle is a file, otherwise `false`.

## Defined in

[fs/utils.ts:57](https://github.com/JiangJie/happy-opfs/blob/6e8cfb02baa55aecdbfe9b09b83e8895a321cf4e/src/fs/utils.ts#L57)
