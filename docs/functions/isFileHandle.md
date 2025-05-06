[**happy-opfs**](../README.md)

***

[happy-opfs](../README.md) / isFileHandle

# Function: isFileHandle()

```ts
function isFileHandle(handle): handle is FileSystemFileHandle
```

Defined in: [fs/utils.ts:70](https://github.com/JiangJie/happy-opfs/blob/7d6f4902eef2f34868c7991f5501261a1d1ff67a/src/fs/utils.ts#L70)

Whether the handle is a file.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `handle` | `FileSystemHandle` | The handle which is a FileSystemHandle. |

## Returns

`handle is FileSystemFileHandle`

`true` if the handle is a file, otherwise `false`.
