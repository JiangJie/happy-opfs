[**happy-opfs**](../README.md)

***

[happy-opfs](../README.md) / pruneTempSync

# Function: pruneTempSync()

```ts
function pruneTempSync(expired): VoidIOResult
```

Defined in: [worker/opfs\_worker\_adapter.ts:446](https://github.com/JiangJie/happy-opfs/blob/dd0edb865892acc2abe55bcb047ccf0f8773705c/src/worker/opfs_worker_adapter.ts#L446)

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
