[**happy-opfs**](../README.md) • **Docs**

***

[happy-opfs](../README.md) / exists

# Function: exists()

```ts
function exists(path, options?): AsyncIOResult<boolean>
```

Checks whether a file or directory exists at the specified path.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `path` | `string` | The path of the file or directory to check for existence. |
| `options`? | [`ExistsOptions`](../interfaces/ExistsOptions.md) | Optional existence options. |

## Returns

`AsyncIOResult`\<`boolean`\>

A promise that resolves to an `AsyncIOResult` indicating whether the file or directory exists.

## Defined in

[fs/opfs\_ext.ts:60](https://github.com/JiangJie/happy-opfs/blob/584e221ed8f9c25f1e723b7898a60bc25fe8652b/src/fs/opfs_ext.ts#L60)
