[**happy-opfs**](../README.md)

***

[happy-opfs](../README.md) / createFileSync

# Function: createFileSync()

```ts
function createFileSync(filePath): VoidIOResult
```

Defined in: [worker/opfs\_worker\_adapter.ts:196](https://github.com/JiangJie/happy-opfs/blob/dd0edb865892acc2abe55bcb047ccf0f8773705c/src/worker/opfs_worker_adapter.ts#L196)

Synchronous version of `createFile`.
Creates a new empty file at the specified path.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `filePath` | `string` | The absolute path of the file to create. |

## Returns

`VoidIOResult`

A `VoidIOResult` indicating success or failure.

## See

[createFile](createFile.md) for the async version.
