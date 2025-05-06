[**happy-opfs**](../README.md)

***

[happy-opfs](../README.md) / emptyDir

# Function: emptyDir()

```ts
function emptyDir(dirPath): AsyncVoidIOResult
```

Defined in: [fs/opfs\_ext.ts:152](https://github.com/JiangJie/happy-opfs/blob/7d6f4902eef2f34868c7991f5501261a1d1ff67a/src/fs/opfs_ext.ts#L152)

Empties the contents of a directory at the specified path.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `dirPath` | `string` | The path of the directory to empty. |

## Returns

`AsyncVoidIOResult`

A promise that resolves to an `AsyncIOResult` indicating whether the directory was successfully emptied.
