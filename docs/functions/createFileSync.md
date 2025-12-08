[**happy-opfs**](../README.md)

***

[happy-opfs](../README.md) / createFileSync

# Function: createFileSync()

```ts
function createFileSync(filePath): VoidIOResult
```

Defined in: [worker/opfs\_worker\_adapter.ts:144](https://github.com/JiangJie/happy-opfs/blob/1ca6e66c9ddde628f35ecf68e910628f2b61ed78/src/worker/opfs_worker_adapter.ts#L144)

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
