[**happy-opfs**](../README.md) • **Docs**

***

[happy-opfs](../README.md) / readDirSync

# Function: readDirSync()

```ts
function readDirSync(dirPath, options?): IOResult<ReadDirEntrySync[]>
```

Sync version of `readDir`.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `dirPath` | `string` |
| `options`? | [`ReadDirOptions`](../interfaces/ReadDirOptions.md) |

## Returns

`IOResult`\<[`ReadDirEntrySync`](../interfaces/ReadDirEntrySync.md)[]\>

## Defined in

[worker/opfs\_worker\_adapter.ts:111](https://github.com/JiangJie/happy-opfs/blob/41bfb9280ee562c4a8708809308f96d116edb112/src/worker/opfs_worker_adapter.ts#L111)
