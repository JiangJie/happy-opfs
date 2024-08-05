[**happy-opfs**](../README.md) • **Docs**

***

[happy-opfs](../README.md) / remove

# Function: remove()

```ts
function remove(path): AsyncVoidIOResult
```

Removes a file or directory at the specified path same as `rm -rf`.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `path` | `string` | The path of the file or directory to remove. |

## Returns

`AsyncVoidIOResult`

A promise that resolves to an `AsyncIOResult` indicating whether the file or directory was successfully removed.

## Defined in

[fs/opfs\_core.ts:127](https://github.com/JiangJie/happy-opfs/blob/6253d25d45ee43710777316ce4d92b062d8744f7/src/fs/opfs_core.ts#L127)
