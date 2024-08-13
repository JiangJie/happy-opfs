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

[fs/opfs\_tmp.ts:38](https://github.com/JiangJie/happy-opfs/blob/41bfb9280ee562c4a8708809308f96d116edb112/src/fs/opfs_tmp.ts#L38)
