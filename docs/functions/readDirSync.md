[**happy-opfs**](../README.md)

***

[happy-opfs](../README.md) / readDirSync

# Function: readDirSync()

```ts
function readDirSync(dirPath, options?): IOResult<ReadDirEntrySync[]>
```

Defined in: [worker/opfs\_worker\_adapter.ts:132](https://github.com/JiangJie/happy-opfs/blob/7d6f4902eef2f34868c7991f5501261a1d1ff67a/src/worker/opfs_worker_adapter.ts#L132)

Sync version of `readDir`.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `dirPath` | `string` |
| `options`? | [`ReadDirOptions`](../interfaces/ReadDirOptions.md) |

## Returns

`IOResult`\<[`ReadDirEntrySync`](../interfaces/ReadDirEntrySync.md)[]\>
