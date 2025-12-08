[**happy-opfs**](../README.md)

***

[happy-opfs](../README.md) / mkTempSync

# Function: mkTempSync()

```ts
function mkTempSync(options?): IOResult<string>
```

Defined in: [worker/opfs\_worker\_adapter.ts:380](https://github.com/JiangJie/happy-opfs/blob/1ca6e66c9ddde628f35ecf68e910628f2b61ed78/src/worker/opfs_worker_adapter.ts#L380)

Synchronous version of `mkTemp`.
Creates a temporary file or directory.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `options`? | [`TempOptions`](../interfaces/TempOptions.md) | Optional temp options (e.g., isDirectory, basename, extname). |

## Returns

`IOResult`\<`string`\>

An `IOResult` containing the temporary path.

## See

[mkTemp](mkTemp.md) for the async version.
