[**happy-opfs**](../README.md)

***

[happy-opfs](../README.md) / mkTempSync

# Function: mkTempSync()

```ts
function mkTempSync(options?): IOResult<string>
```

Defined in: [worker/opfs\_worker\_adapter.ts:434](https://github.com/JiangJie/happy-opfs/blob/dd0edb865892acc2abe55bcb047ccf0f8773705c/src/worker/opfs_worker_adapter.ts#L434)

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
