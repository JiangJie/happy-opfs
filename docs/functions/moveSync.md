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

Defined in: [worker/opfs\_worker\_adapter.ts:170](https://github.com/JiangJie/happy-opfs/blob/1ca6e66c9ddde628f35ecf68e910628f2b61ed78/src/worker/opfs_worker_adapter.ts#L170)

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
