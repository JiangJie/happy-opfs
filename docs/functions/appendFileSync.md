[**happy-opfs**](../README.md)

***

[happy-opfs](../README.md) / appendFileSync

# Function: appendFileSync()

```ts
function appendFileSync(filePath, contents): VoidIOResult
```

Defined in: [worker/opfs\_worker\_adapter.ts:372](https://github.com/JiangJie/happy-opfs/blob/dd0edb865892acc2abe55bcb047ccf0f8773705c/src/worker/opfs_worker_adapter.ts#L372)

Synchronous version of `appendFile`.
Appends content to a file at the specified path.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `filePath` | `string` | The absolute path of the file to append to. |
| `contents` | [`WriteSyncFileContent`](../type-aliases/WriteSyncFileContent.md) | The content to append (ArrayBuffer, TypedArray, or string). |

## Returns

`VoidIOResult`

A `VoidIOResult` indicating success or failure.

## See

[appendFile](appendFile.md) for the async version.
