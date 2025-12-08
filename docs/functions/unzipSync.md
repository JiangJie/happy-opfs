[**happy-opfs**](../README.md)

***

[happy-opfs](../README.md) / unzipSync

# Function: unzipSync()

```ts
function unzipSync(zipFilePath, targetPath): VoidIOResult
```

Defined in: [worker/opfs\_worker\_adapter.ts:471](https://github.com/JiangJie/happy-opfs/blob/1ca6e66c9ddde628f35ecf68e910628f2b61ed78/src/worker/opfs_worker_adapter.ts#L471)

Synchronous version of `unzip`.
Extracts a zip file to a directory.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `zipFilePath` | `string` | The path to the zip file. |
| `targetPath` | `string` | The directory to extract to. |

## Returns

`VoidIOResult`

A `VoidIOResult` indicating success or failure.

## See

[unzip](unzip.md) for the async version.
