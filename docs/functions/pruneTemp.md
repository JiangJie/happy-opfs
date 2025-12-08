[**happy-opfs**](../README.md)

***

[happy-opfs](../README.md) / pruneTemp

# Function: pruneTemp()

```ts
function pruneTemp(expired): AsyncVoidIOResult
```

Defined in: [fs/opfs\_tmp.ts:71](https://github.com/JiangJie/happy-opfs/blob/1ca6e66c9ddde628f35ecf68e910628f2b61ed78/src/fs/opfs_tmp.ts#L71)

Removes expired files from the temporary directory.
Only removes files whose `lastModified` time is before the specified date.

**Note:** This function only removes files, not empty directories.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `expired` | `Date` | Files modified before this date will be deleted. |

## Returns

`AsyncVoidIOResult`

A promise that resolves to an `AsyncVoidIOResult` indicating success or failure.

## Example

```typescript
// Remove files older than 24 hours
const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
const result = await pruneTemp(yesterday);
```
