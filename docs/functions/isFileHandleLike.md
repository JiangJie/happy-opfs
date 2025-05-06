[**happy-opfs**](../README.md)

***

[happy-opfs](../README.md) / isFileHandleLike

# Function: isFileHandleLike()

```ts
function isFileHandleLike(handle): handle is FileSystemFileHandleLike
```

Defined in: [fs/utils.ts:88](https://github.com/JiangJie/happy-opfs/blob/7d6f4902eef2f34868c7991f5501261a1d1ff67a/src/fs/utils.ts#L88)

Whether the handle is a file-like.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `handle` | [`FileSystemHandleLike`](../interfaces/FileSystemHandleLike.md) | The handle which is a FileSystemHandleLike. |

## Returns

`handle is FileSystemFileHandleLike`

`true` if the handle is a file, otherwise `false`.
