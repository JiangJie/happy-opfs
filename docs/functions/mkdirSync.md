[**happy-opfs**](../README.md)

***

[happy-opfs](../README.md) / mkdirSync

# Function: mkdirSync()

```ts
function mkdirSync(dirPath): VoidIOResult
```

Defined in: [worker/opfs\_worker\_adapter.ts:156](https://github.com/JiangJie/happy-opfs/blob/1ca6e66c9ddde628f35ecf68e910628f2b61ed78/src/worker/opfs_worker_adapter.ts#L156)

Synchronous version of `mkdir`.
Creates a directory at the specified path, including any necessary parent directories.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `dirPath` | `string` | The absolute path of the directory to create. |

## Returns

`VoidIOResult`

A `VoidIOResult` indicating success or failure.

## See

[mkdir](mkdir.md) for the async version.
