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

[opfs\_ext.ts:28](https://github.com/JiangJie/happy-opfs/blob/0955d4be7b0440a9e0261193bc3c402389d8f518/src/fs/opfs_ext.ts#L28)
