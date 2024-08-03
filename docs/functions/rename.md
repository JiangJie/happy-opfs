[**happy-opfs**](../README.md) • **Docs**

***

[happy-opfs](../README.md) / rename

# Function: rename()

```ts
function rename(oldPath, newPath): AsyncIOResult<boolean>
```

Renames a file or directory from an old path to a new path.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `oldPath` | `string` | The current path of the file or directory. |
| `newPath` | `string` | The new path of the file or directory. |

## Returns

`AsyncIOResult`\<`boolean`\>

A promise that resolves to an `AsyncIOResult` indicating whether the file or directory was successfully renamed.

## Defined in

[fs/opfs\_core.ts:166](https://github.com/JiangJie/happy-opfs/blob/584e221ed8f9c25f1e723b7898a60bc25fe8652b/src/fs/opfs_core.ts#L166)
