[**happy-opfs**](../README.md) • **Docs**

***

[happy-opfs](../README.md) / emptyDir

# Function: emptyDir()

```ts
function emptyDir(dirPath): AsyncIOResult<boolean>
```

Empties the contents of a directory at the specified path.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `dirPath` | `string` | The path of the directory to empty. |

## Returns

`AsyncIOResult`\<`boolean`\>

A promise that resolves to an `AsyncIOResult` indicating whether the directory was successfully emptied.

## Defined in

[fs/opfs\_ext.ts:29](https://github.com/JiangJie/happy-opfs/blob/e9fb685299dadc4e6e669ad2019dbf147a8f564a/src/fs/opfs_ext.ts#L29)
