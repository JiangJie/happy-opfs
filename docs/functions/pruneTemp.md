[**happy-opfs**](../README.md) • **Docs**

***

[happy-opfs](../README.md) / pruneTemp

# Function: pruneTemp()

```ts
function pruneTemp(expired): AsyncVoidIOResult
```

Prune the temporary directory and delete all expired files.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `expired` | `Date` | The date to determine whether a file is expired. |

## Returns

`AsyncVoidIOResult`

A promise that resolves to an `AsyncVoidIOResult` indicating whether the temporary directory was successfully pruned.

## Defined in

[fs/opfs\_tmp.ts:38](https://github.com/JiangJie/happy-opfs/blob/7bfec3b71684ddcf0fe3092672c66c9664776bcc/src/fs/opfs_tmp.ts#L38)
