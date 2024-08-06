[**happy-opfs**](../README.md) • **Docs**

***

[happy-opfs](../README.md) / rename

# Function: rename()

```ts
function rename(oldPath, newPath): AsyncVoidIOResult
```

Renames a file or directory from an old path to a new path.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `oldPath` | `string` | The current path of the file or directory. |
| `newPath` | `string` | The new path of the file or directory. |

## Returns

`AsyncVoidIOResult`

A promise that resolves to an `AsyncIOResult` indicating whether the file or directory was successfully renamed.

## Defined in

[fs/opfs\_core.ts:163](https://github.com/JiangJie/happy-opfs/blob/b6f122787c0a1042b0551ee35b286e55a132e2d7/src/fs/opfs_core.ts#L163)
