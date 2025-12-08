[**happy-opfs**](../README.md)

***

[happy-opfs](../README.md) / removeSync

# Function: removeSync()

```ts
function removeSync(path): VoidIOResult
```

Defined in: [worker/opfs\_worker\_adapter.ts:260](https://github.com/JiangJie/happy-opfs/blob/1ca6e66c9ddde628f35ecf68e910628f2b61ed78/src/worker/opfs_worker_adapter.ts#L260)

Synchronous version of `remove`.
Removes a file or directory at the specified path.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `path` | `string` | The absolute path of the file or directory to remove. |

## Returns

`VoidIOResult`

A `VoidIOResult` indicating success or failure.

## See

[remove](remove.md) for the async version.
