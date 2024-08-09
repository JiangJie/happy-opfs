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

[fs/utils.ts:79](https://github.com/JiangJie/happy-opfs/blob/a6314c4612c605f77895adcb9d6d91abcaafaa7d/src/fs/utils.ts#L79)
