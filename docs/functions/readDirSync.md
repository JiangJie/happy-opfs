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

[worker/opfs\_worker\_adapter.ts:111](https://github.com/JiangJie/happy-opfs/blob/1fc39add615fcd3c1ee38b13edeb0d38cd3481c4/src/worker/opfs_worker_adapter.ts#L111)
