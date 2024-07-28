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

[opfs\_core.ts:139](https://github.com/JiangJie/happy-opfs/blob/4af0ec94e963041b297916e2971f6a01ca677a5c/src/fs/opfs_core.ts#L139)
