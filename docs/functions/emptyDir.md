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

[fs/opfs\_ext.ts:152](https://github.com/JiangJie/happy-opfs/blob/1fc39add615fcd3c1ee38b13edeb0d38cd3481c4/src/fs/opfs_ext.ts#L152)
