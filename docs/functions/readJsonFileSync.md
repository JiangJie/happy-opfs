[**happy-opfs**](../README.md)

***

[happy-opfs](../README.md) / readJsonFileSync

# Function: readJsonFileSync()

```ts
function readJsonFileSync<T>(filePath): IOResult<T>
```

Defined in: [worker/opfs\_worker\_adapter.ts:419](https://github.com/JiangJie/happy-opfs/blob/1ca6e66c9ddde628f35ecf68e910628f2b61ed78/src/worker/opfs_worker_adapter.ts#L419)

Synchronous version of `readJsonFile`.
Reads and parses a JSON file.

## Type Parameters

| Type Parameter | Description |
| ------ | ------ |
| `T` | The expected type of the parsed JSON. |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `filePath` | `string` | The absolute path of the JSON file to read. |

## Returns

`IOResult`\<`T`\>

An `IOResult` containing the parsed JSON object.

## See

[readJsonFile](readJsonFile.md) for the async version.
