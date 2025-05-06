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

Defined in: [worker/opfs\_worker\_adapter.ts:200](https://github.com/JiangJie/happy-opfs/blob/7d6f4902eef2f34868c7991f5501261a1d1ff67a/src/worker/opfs_worker_adapter.ts#L200)

Sync version of `writeFile`.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `filePath` | `string` |
| `contents` | [`WriteSyncFileContent`](../type-aliases/WriteSyncFileContent.md) |
| `options`? | [`WriteOptions`](../interfaces/WriteOptions.md) |

## Returns

`VoidIOResult`
