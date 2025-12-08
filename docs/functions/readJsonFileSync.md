[**happy-opfs**](../README.md)

***

[happy-opfs](../README.md) / readJsonFileSync

# Function: readJsonFileSync()

```ts
function readJsonFileSync<T>(filePath): IOResult<T>
```

Defined in: [worker/opfs\_worker\_adapter.ts:473](https://github.com/JiangJie/happy-opfs/blob/dd0edb865892acc2abe55bcb047ccf0f8773705c/src/worker/opfs_worker_adapter.ts#L473)

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
