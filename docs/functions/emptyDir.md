[**happy-opfs**](../README.md) • **Docs**

***

[happy-opfs](../README.md) / emptyDir

# Function: emptyDir()

```ts
function emptyDir(dirPath): AsyncVoidIOResult
```

Empties the contents of a directory at the specified path.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `dirPath` | `string` | The path of the directory to empty. |

## Returns

`AsyncVoidIOResult`

A promise that resolves to an `AsyncIOResult` indicating whether the directory was successfully emptied.

## Defined in

[fs/opfs\_ext.ts:112](https://github.com/JiangJie/happy-opfs/blob/7bfec3b71684ddcf0fe3092672c66c9664776bcc/src/fs/opfs_ext.ts#L112)
