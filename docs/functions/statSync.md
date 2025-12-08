[**happy-opfs**](../README.md)

***

[happy-opfs](../README.md) / statSync

# Function: statSync()

```ts
function statSync(path): IOResult<FileSystemHandleLike>
```

Defined in: [worker/opfs\_worker\_adapter.ts:272](https://github.com/JiangJie/happy-opfs/blob/1ca6e66c9ddde628f35ecf68e910628f2b61ed78/src/worker/opfs_worker_adapter.ts#L272)

Synchronous version of `stat`.
Retrieves metadata about a file or directory.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `path` | `string` | The absolute path to get status for. |

## Returns

`IOResult`\<[`FileSystemHandleLike`](../interfaces/FileSystemHandleLike.md)\>

An `IOResult` containing a `FileSystemHandleLike` object.

## See

[stat](stat.md) for the async version.
