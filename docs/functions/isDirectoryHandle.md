[**happy-opfs**](../README.md)

***

[happy-opfs](../README.md) / isDirectoryHandle

# Function: isDirectoryHandle()

```ts
function isDirectoryHandle(handle): handle is FileSystemDirectoryHandle
```

Defined in: [fs/utils.ts:79](https://github.com/JiangJie/happy-opfs/blob/318f46cfcd998ebd962bc0e9335ea2aaef290cf7/src/fs/utils.ts#L79)

Whether the handle is a directory.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `handle` | `FileSystemHandle` | The handle which is a FileSystemHandle. |

## Returns

`handle is FileSystemDirectoryHandle`

`true` if the handle is a directory, otherwise `false`.
