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

[fs/utils.ts:88](https://github.com/JiangJie/happy-opfs/blob/1fc39add615fcd3c1ee38b13edeb0d38cd3481c4/src/fs/utils.ts#L88)
