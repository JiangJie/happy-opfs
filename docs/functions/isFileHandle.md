[**happy-opfs**](../README.md)

***

[happy-opfs](../README.md) / isFileHandle

# Function: isFileHandle()

```ts
function isFileHandle(handle): handle is FileSystemFileHandle
```

Defined in: [fs/utils.ts:70](https://github.com/JiangJie/happy-opfs/blob/318f46cfcd998ebd962bc0e9335ea2aaef290cf7/src/fs/utils.ts#L70)

Whether the handle is a file.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `handle` | `FileSystemHandle` | The handle which is a FileSystemHandle. |

## Returns

`handle is FileSystemFileHandle`

`true` if the handle is a file, otherwise `false`.
