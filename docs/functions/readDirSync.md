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

[worker/opfs\_worker\_adapter.ts:104](https://github.com/JiangJie/happy-opfs/blob/a6314c4612c605f77895adcb9d6d91abcaafaa7d/src/worker/opfs_worker_adapter.ts#L104)
