[**happy-opfs**](../README.md)

***

[happy-opfs](../README.md) / readTextFileSync

# Function: readTextFileSync()

```ts
function readTextFileSync(filePath): IOResult<string>
```

Defined in: [worker/opfs\_worker\_adapter.ts:491](https://github.com/JiangJie/happy-opfs/blob/dd0edb865892acc2abe55bcb047ccf0f8773705c/src/worker/opfs_worker_adapter.ts#L491)

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
