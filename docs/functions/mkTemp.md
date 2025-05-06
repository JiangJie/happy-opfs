[**happy-opfs**](../README.md)

***

[happy-opfs](../README.md) / mkTemp

# Function: mkTemp()

```ts
function mkTemp(options?): AsyncIOResult<string>
```

Defined in: [fs/opfs\_tmp.ts:14](https://github.com/JiangJie/happy-opfs/blob/7d6f4902eef2f34868c7991f5501261a1d1ff67a/src/fs/opfs_tmp.ts#L14)

Create a temporary file or directory.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `options`? | [`TempOptions`](../interfaces/TempOptions.md) | Options and flags. |

## Returns

`AsyncIOResult`\<`string`\>

A promise that resolves the result of the temporary file or directory path.
