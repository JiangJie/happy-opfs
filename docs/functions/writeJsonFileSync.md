[**happy-opfs**](../README.md)

***

[happy-opfs](../README.md) / writeJsonFileSync

# Function: writeJsonFileSync()

```ts
function writeJsonFileSync<T>(filePath, data): VoidIOResult
```

Defined in: [worker/opfs\_worker\_adapter.ts:507](https://github.com/JiangJie/happy-opfs/blob/dd0edb865892acc2abe55bcb047ccf0f8773705c/src/worker/opfs_worker_adapter.ts#L507)

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
