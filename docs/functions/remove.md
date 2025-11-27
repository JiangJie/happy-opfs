[**happy-opfs**](../README.md)

***

[happy-opfs](../README.md) / remove

# Function: remove()

```ts
function remove(path): AsyncVoidIOResult
```

Defined in: [fs/opfs\_core.ts:143](https://github.com/JiangJie/happy-opfs/blob/318f46cfcd998ebd962bc0e9335ea2aaef290cf7/src/fs/opfs_core.ts#L143)

Removes a file or directory at the specified path same as `rm -rf`.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `path` | `string` | The path of the file or directory to remove. |

## Returns

`AsyncVoidIOResult`

A promise that resolves to an `AsyncIOResult` indicating whether the file or directory was successfully removed.
