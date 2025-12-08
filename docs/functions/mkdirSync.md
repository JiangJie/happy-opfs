[**happy-opfs**](../README.md)

***

[happy-opfs](../README.md) / mkdirSync

# Function: mkdirSync()

```ts
function mkdirSync(dirPath): VoidIOResult
```

Defined in: [worker/opfs\_worker\_adapter.ts:208](https://github.com/JiangJie/happy-opfs/blob/dd0edb865892acc2abe55bcb047ccf0f8773705c/src/worker/opfs_worker_adapter.ts#L208)

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
