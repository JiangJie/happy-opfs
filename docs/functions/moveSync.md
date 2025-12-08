[**happy-opfs**](../README.md)

***

[happy-opfs](../README.md) / moveSync

# Function: moveSync()

```ts
function moveSync(
   srcPath, 
   destPath, 
   options?): VoidIOResult
```

Defined in: [worker/opfs\_worker\_adapter.ts:222](https://github.com/JiangJie/happy-opfs/blob/dd0edb865892acc2abe55bcb047ccf0f8773705c/src/worker/opfs_worker_adapter.ts#L222)

Synchronous version of `move`.
Moves a file or directory from one location to another.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `srcPath` | `string` | The source path. |
| `destPath` | `string` | The destination path. |
| `options`? | [`MoveOptions`](../interfaces/MoveOptions.md) | Optional move options. |

## Returns

`VoidIOResult`

A `VoidIOResult` indicating success or failure.

## See

[move](move.md) for the async version.
