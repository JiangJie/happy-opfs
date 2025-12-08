[**happy-opfs**](../README.md)

***

[happy-opfs](../README.md) / readBlobFileSync

# Function: readBlobFileSync()

```ts
function readBlobFileSync(filePath): IOResult<FileLike>
```

Defined in: [worker/opfs\_worker\_adapter.ts:404](https://github.com/JiangJie/happy-opfs/blob/1ca6e66c9ddde628f35ecf68e910628f2b61ed78/src/worker/opfs_worker_adapter.ts#L404)

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
