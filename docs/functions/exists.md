[**happy-opfs**](../README.md)

***

[happy-opfs](../README.md) / exists

# Function: exists()

```ts
function exists(path, options?): AsyncIOResult<boolean>
```

Defined in: [fs/opfs\_ext.ts:176](https://github.com/JiangJie/happy-opfs/blob/7d6f4902eef2f34868c7991f5501261a1d1ff67a/src/fs/opfs_ext.ts#L176)

Checks whether a file or directory exists at the specified path.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `path` | `string` | The path of the file or directory to check for existence. |
| `options`? | [`ExistsOptions`](../interfaces/ExistsOptions.md) | Optional existence options. |

## Returns

`AsyncIOResult`\<`boolean`\>

A promise that resolves to an `AsyncIOResult` indicating whether the file or directory exists.
