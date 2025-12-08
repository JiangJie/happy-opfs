[**happy-opfs**](../README.md)

***

[happy-opfs](../README.md) / emptyDirSync

# Function: emptyDirSync()

```ts
function emptyDirSync(dirPath): VoidIOResult
```

Defined in: [worker/opfs\_worker\_adapter.ts:398](https://github.com/JiangJie/happy-opfs/blob/dd0edb865892acc2abe55bcb047ccf0f8773705c/src/worker/opfs_worker_adapter.ts#L398)

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
