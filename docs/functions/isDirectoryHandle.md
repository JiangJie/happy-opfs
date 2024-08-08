[**happy-opfs**](../README.md) • **Docs**

***

[happy-opfs](../README.md) / isDirectoryHandle

# Function: isDirectoryHandle()

```ts
function isDirectoryHandle(handle): handle is FileSystemDirectoryHandle
```

Whether the handle is a directory.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `handle` | `FileSystemHandle` | The handle which is a FileSystemHandle. |

## Returns

`handle is FileSystemDirectoryHandle`

`true` if the handle is a directory, otherwise `false`.

## Defined in

[fs/utils.ts:48](https://github.com/JiangJie/happy-opfs/blob/6e8cfb02baa55aecdbfe9b09b83e8895a321cf4e/src/fs/utils.ts#L48)
