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
| ------ | ------ | ------ |
| `path` | `string` | The path of the file or directory to remove. |

## Returns

`AsyncIOResult`\<`boolean`\>

A promise that resolves to an `AsyncIOResult` indicating whether the file or directory was successfully removed.

## Defined in

[fs/opfs\_core.ts:131](https://github.com/JiangJie/happy-opfs/blob/e9fb685299dadc4e6e669ad2019dbf147a8f564a/src/fs/opfs_core.ts#L131)
