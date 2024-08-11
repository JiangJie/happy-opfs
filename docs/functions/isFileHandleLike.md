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

[fs/utils.ts:88](https://github.com/JiangJie/happy-opfs/blob/7bfec3b71684ddcf0fe3092672c66c9664776bcc/src/fs/utils.ts#L88)
