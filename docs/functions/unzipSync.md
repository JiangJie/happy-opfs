[**happy-opfs**](../README.md)

***

[happy-opfs](../README.md) / unzipSync

# Function: unzipSync()

```ts
function unzipSync(zipFilePath, targetPath): VoidIOResult
```

Defined in: [worker/opfs\_worker\_adapter.ts:525](https://github.com/JiangJie/happy-opfs/blob/dd0edb865892acc2abe55bcb047ccf0f8773705c/src/worker/opfs_worker_adapter.ts#L525)

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
