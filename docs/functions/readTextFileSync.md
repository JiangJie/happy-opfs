[**happy-opfs**](../README.md)

***

[happy-opfs](../README.md) / readTextFileSync

# Function: readTextFileSync()

```ts
function readTextFileSync(filePath): IOResult<string>
```

Defined in: [worker/opfs\_worker\_adapter.ts:437](https://github.com/JiangJie/happy-opfs/blob/1ca6e66c9ddde628f35ecf68e910628f2b61ed78/src/worker/opfs_worker_adapter.ts#L437)

Synchronous version of `readTextFile`.
Reads a file as a UTF-8 string.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `filePath` | `string` | The absolute path of the file to read. |

## Returns

`IOResult`\<`string`\>

An `IOResult` containing the file content as a string.

## See

[readTextFile](readTextFile.md) for the async version.
