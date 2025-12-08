[**happy-opfs**](../README.md)

***

[happy-opfs](../README.md) / statSync

# Function: statSync()

```ts
function statSync(path): IOResult<FileSystemHandleLike>
```

Defined in: [worker/opfs\_worker\_adapter.ts:324](https://github.com/JiangJie/happy-opfs/blob/dd0edb865892acc2abe55bcb047ccf0f8773705c/src/worker/opfs_worker_adapter.ts#L324)

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
