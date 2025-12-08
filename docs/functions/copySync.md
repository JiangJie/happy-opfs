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

Defined in: [worker/opfs\_worker\_adapter.ts:386](https://github.com/JiangJie/happy-opfs/blob/dd0edb865892acc2abe55bcb047ccf0f8773705c/src/worker/opfs_worker_adapter.ts#L386)

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
