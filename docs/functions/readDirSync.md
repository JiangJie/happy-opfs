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

[worker/opfs\_worker\_adapter.ts:98](https://github.com/JiangJie/happy-opfs/blob/e9fb685299dadc4e6e669ad2019dbf147a8f564a/src/worker/opfs_worker_adapter.ts#L98)
