[**happy-opfs**](../README.md)

***

[happy-opfs](../README.md) / emptyDirSync

# Function: emptyDirSync()

```ts
function emptyDirSync(dirPath): VoidIOResult
```

Defined in: [worker/opfs\_worker\_adapter.ts:344](https://github.com/JiangJie/happy-opfs/blob/1ca6e66c9ddde628f35ecf68e910628f2b61ed78/src/worker/opfs_worker_adapter.ts#L344)

Synchronous version of `emptyDir`.
Removes all contents of a directory.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `dirPath` | `string` | The absolute path of the directory to empty. |

## Returns

`VoidIOResult`

A `VoidIOResult` indicating success or failure.

## See

[emptyDir](emptyDir.md) for the async version.
