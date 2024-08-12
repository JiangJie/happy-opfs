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

[fs/utils.ts:79](https://github.com/JiangJie/happy-opfs/blob/1fc39add615fcd3c1ee38b13edeb0d38cd3481c4/src/fs/utils.ts#L79)
