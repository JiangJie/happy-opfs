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
| :------ | :------ | :------ |
| `dirPath` | `string` | The path of the directory to empty. |

## Returns

`AsyncIOResult`\<`boolean`\>

A promise that resolves to an `AsyncIOResult` indicating whether the directory was successfully emptied.

## Source

[fs/opfs\_ext.ts:26](https://github.com/JiangJie/happy-opfs/blob/fcbf5b5ef2676cbf90b3a855acdadcf7a79ef72c/src/fs/opfs_ext.ts#L26)
