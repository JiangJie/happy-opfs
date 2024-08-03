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

[fs/opfs\_core.ts:127](https://github.com/JiangJie/happy-opfs/blob/ff451a853f34b3dedd716c1414a17eb57f239434/src/fs/opfs_core.ts#L127)
