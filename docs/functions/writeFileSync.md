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

Defined in: [worker/opfs\_worker\_adapter.ts:305](https://github.com/JiangJie/happy-opfs/blob/1ca6e66c9ddde628f35ecf68e910628f2b61ed78/src/worker/opfs_worker_adapter.ts#L305)

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
