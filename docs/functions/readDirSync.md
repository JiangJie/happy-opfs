[**happy-opfs**](../README.md)

***

[happy-opfs](../README.md) / readDirSync

# Function: readDirSync()

```ts
function readDirSync(dirPath, options?): IOResult<ReadDirEntrySync[]>
```

Defined in: [worker/opfs\_worker\_adapter.ts:235](https://github.com/JiangJie/happy-opfs/blob/dd0edb865892acc2abe55bcb047ccf0f8773705c/src/worker/opfs_worker_adapter.ts#L235)

Synchronous version of `readDir`.
Reads the contents of a directory.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `dirPath` | `string` | The absolute path of the directory to read. |
| `options`? | [`ReadDirOptions`](../interfaces/ReadDirOptions.md) | Optional read options (e.g., recursive). |

## Returns

`IOResult`\<[`ReadDirEntrySync`](../interfaces/ReadDirEntrySync.md)[]\>

An `IOResult` containing an array of directory entries.

## See

[readDir](readDir.md) for the async version.
