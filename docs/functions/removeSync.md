[**happy-opfs**](../README.md)

***

[happy-opfs](../README.md) / removeSync

# Function: removeSync()

```ts
function removeSync(path): VoidIOResult
```

Defined in: [worker/opfs\_worker\_adapter.ts:312](https://github.com/JiangJie/happy-opfs/blob/dd0edb865892acc2abe55bcb047ccf0f8773705c/src/worker/opfs_worker_adapter.ts#L312)

Synchronous version of `remove`.
Removes a file or directory at the specified path.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `path` | `string` | The absolute path of the file or directory to remove. |

## Returns

`VoidIOResult`

A `VoidIOResult` indicating success or failure.

## See

[remove](remove.md) for the async version.
