[**happy-opfs**](../README.md) • **Docs**

***

[happy-opfs](../README.md) / remove

# Function: remove()

```ts
function remove(path): AsyncIOResult<boolean>
```

Removes a file or directory at the specified path same as `rm -rf`.

## Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `path` | `string` | The path of the file or directory to remove. |

## Returns

`AsyncIOResult`\<`boolean`\>

A promise that resolves to an `AsyncIOResult` indicating whether the file or directory was successfully removed.

## Source

[fs/opfs\_core.ts:117](https://github.com/JiangJie/happy-opfs/blob/fcbf5b5ef2676cbf90b3a855acdadcf7a79ef72c/src/fs/opfs_core.ts#L117)
