[**happy-opfs**](../README.md)

***

[happy-opfs](../README.md) / pruneTemp

# Function: pruneTemp()

```ts
function pruneTemp(expired): AsyncVoidIOResult
```

Defined in: [fs/opfs\_tmp.ts:38](https://github.com/JiangJie/happy-opfs/blob/318f46cfcd998ebd962bc0e9335ea2aaef290cf7/src/fs/opfs_tmp.ts#L38)

Prune the temporary directory and delete all expired files.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `expired` | `Date` | The date to determine whether a file is expired. |

## Returns

`AsyncVoidIOResult`

A promise that resolves to an `AsyncVoidIOResult` indicating whether the temporary directory was successfully pruned.
