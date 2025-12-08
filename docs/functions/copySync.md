[**happy-opfs**](../README.md)

***

[happy-opfs](../README.md) / copySync

# Function: copySync()

```ts
function copySync(
   srcPath, 
   destPath, 
   options?): VoidIOResult
```

Defined in: [worker/opfs\_worker\_adapter.ts:332](https://github.com/JiangJie/happy-opfs/blob/1ca6e66c9ddde628f35ecf68e910628f2b61ed78/src/worker/opfs_worker_adapter.ts#L332)

Synchronous version of `copy`.
Copies a file or directory from one location to another.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `srcPath` | `string` | The source path. |
| `destPath` | `string` | The destination path. |
| `options`? | [`CopyOptions`](../interfaces/CopyOptions.md) | Optional copy options. |

## Returns

`VoidIOResult`

A `VoidIOResult` indicating success or failure.

## See

[copy](copy.md) for the async version.
