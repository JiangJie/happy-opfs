[**happy-opfs**](../README.md)

***

[happy-opfs](../README.md) / pruneTempSync

# Function: pruneTempSync()

```ts
function pruneTempSync(expired): VoidIOResult
```

Defined in: [worker/opfs\_worker\_adapter.ts:392](https://github.com/JiangJie/happy-opfs/blob/1ca6e66c9ddde628f35ecf68e910628f2b61ed78/src/worker/opfs_worker_adapter.ts#L392)

Synchronous version of `pruneTemp`.
Removes expired files from the temporary directory.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `expired` | `Date` | Files with lastModified before this date will be removed. |

## Returns

`VoidIOResult`

A `VoidIOResult` indicating success or failure.

## See

[pruneTemp](pruneTemp.md) for the async version.
