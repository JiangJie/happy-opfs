[**happy-opfs**](../README.md) • **Docs**

***

[happy-opfs](../README.md) / move

# Function: move()

```ts
function move(oldPath, newPath): AsyncVoidIOResult
```

Move a file or directory from an old path to a new path.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `oldPath` | `string` | The current path of the file or directory. |
| `newPath` | `string` | The new path of the file or directory. |

## Returns

`AsyncVoidIOResult`

A promise that resolves to an `AsyncIOResult` indicating whether the file or directory was successfully moved.

## Defined in

[fs/opfs\_core.ts:48](https://github.com/JiangJie/happy-opfs/blob/7bfec3b71684ddcf0fe3092672c66c9664776bcc/src/fs/opfs_core.ts#L48)
