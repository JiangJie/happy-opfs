[**happy-opfs**](../README.md)

***

[happy-opfs](../README.md) / readBlobFileSync

# Function: readBlobFileSync()

```ts
function readBlobFileSync(filePath): IOResult<FileLike>
```

Defined in: [worker/opfs\_worker\_adapter.ts:458](https://github.com/JiangJie/happy-opfs/blob/dd0edb865892acc2abe55bcb047ccf0f8773705c/src/worker/opfs_worker_adapter.ts#L458)

Synchronous version of `readBlobFile`.
Reads a file as a `FileLike` object.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `filePath` | `string` | The absolute path of the file to read. |

## Returns

`IOResult`\<[`FileLike`](../interfaces/FileLike.md)\>

An `IOResult` containing a `FileLike` object.

## See

[readBlobFile](readBlobFile.md) for the async version.
