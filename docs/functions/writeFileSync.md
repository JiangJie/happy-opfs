[**happy-opfs**](../README.md) • **Docs**

***

[happy-opfs](../README.md) / writeFileSync

# Function: writeFileSync()

```ts
function writeFileSync(
   filePath, 
   contents, 
   options?): VoidIOResult
```

Sync version of `writeFile`.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `filePath` | `string` |
| `contents` | [`WriteSyncFileContent`](../type-aliases/WriteSyncFileContent.md) |
| `options`? | [`WriteOptions`](../interfaces/WriteOptions.md) |

## Returns

`VoidIOResult`

## Defined in

[worker/opfs\_worker\_adapter.ts:179](https://github.com/JiangJie/happy-opfs/blob/41bfb9280ee562c4a8708809308f96d116edb112/src/worker/opfs_worker_adapter.ts#L179)
