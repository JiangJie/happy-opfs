[**happy-opfs**](../README.md)

***

[happy-opfs](../README.md) / writeFileSync

# Function: writeFileSync()

```ts
function writeFileSync(
   filePath, 
   contents, 
   options?): VoidIOResult
```

Defined in: [worker/opfs\_worker\_adapter.ts:359](https://github.com/JiangJie/happy-opfs/blob/dd0edb865892acc2abe55bcb047ccf0f8773705c/src/worker/opfs_worker_adapter.ts#L359)

Synchronous version of `writeFile`.
Writes content to a file at the specified path.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `filePath` | `string` | The absolute path of the file to write. |
| `contents` | [`WriteSyncFileContent`](../type-aliases/WriteSyncFileContent.md) | The content to write (ArrayBuffer, TypedArray, or string). |
| `options`? | [`WriteOptions`](../interfaces/WriteOptions.md) | Optional write options. |

## Returns

`VoidIOResult`

A `VoidIOResult` indicating success or failure.

## See

[writeFile](writeFile.md) for the async version.
