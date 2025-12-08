[**happy-opfs**](../README.md)

***

[happy-opfs](../README.md) / writeJsonFileSync

# Function: writeJsonFileSync()

```ts
function writeJsonFileSync<T>(filePath, data): VoidIOResult
```

Defined in: [worker/opfs\_worker\_adapter.ts:453](https://github.com/JiangJie/happy-opfs/blob/1ca6e66c9ddde628f35ecf68e910628f2b61ed78/src/worker/opfs_worker_adapter.ts#L453)

Synchronous version of `writeJsonFile`.
Writes an object to a file as JSON.

## Type Parameters

| Type Parameter | Description |
| ------ | ------ |
| `T` | The type of the object to write. |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `filePath` | `string` | The absolute path of the file to write. |
| `data` | `T` | The object to serialize and write. |

## Returns

`VoidIOResult`

A `VoidIOResult` indicating success or failure.

## See

[writeJsonFile](writeJsonFile.md) for the async version.
