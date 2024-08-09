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

[fs/opfs\_tmp.ts:38](https://github.com/JiangJie/happy-opfs/blob/a6314c4612c605f77895adcb9d6d91abcaafaa7d/src/fs/opfs_tmp.ts#L38)
