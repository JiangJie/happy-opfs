[**happy-opfs**](../README.md)

***

[happy-opfs](../README.md) / remove

# Function: remove()

```ts
function remove(path): AsyncVoidIOResult
```

Defined in: [fs/opfs\_core.ts:143](https://github.com/JiangJie/happy-opfs/blob/7d6f4902eef2f34868c7991f5501261a1d1ff67a/src/fs/opfs_core.ts#L143)

Removes a file or directory at the specified path same as `rm -rf`.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `path` | `string` | The path of the file or directory to remove. |

## Returns

`AsyncVoidIOResult`

A promise that resolves to an `AsyncIOResult` indicating whether the file or directory was successfully removed.
