[**happy-opfs**](../README.md)

***

[happy-opfs](../README.md) / pruneTemp

# Function: pruneTemp()

```ts
function pruneTemp(expired): AsyncVoidIOResult
```

Defined in: [fs/opfs\_tmp.ts:38](https://github.com/JiangJie/happy-opfs/blob/7d6f4902eef2f34868c7991f5501261a1d1ff67a/src/fs/opfs_tmp.ts#L38)

Prune the temporary directory and delete all expired files.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `expired` | `Date` | The date to determine whether a file is expired. |

## Returns

`AsyncVoidIOResult`

A promise that resolves to an `AsyncVoidIOResult` indicating whether the temporary directory was successfully pruned.
