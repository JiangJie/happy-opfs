[**happy-opfs**](../README.md) • **Docs**

***

[happy-opfs](../README.md) / mkTemp

# Function: mkTemp()

```ts
function mkTemp(options?): AsyncIOResult<string>
```

Create a temporary file or directory.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `options`? | [`TempOptions`](../interfaces/TempOptions.md) | Options and flags. |

## Returns

`AsyncIOResult`\<`string`\>

A promise that resolves the result of the temporary file or directory path.

## Defined in

[fs/opfs\_tmp.ts:14](https://github.com/JiangJie/happy-opfs/blob/7bfec3b71684ddcf0fe3092672c66c9664776bcc/src/fs/opfs_tmp.ts#L14)
