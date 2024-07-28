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

[opfs\_ext.ts:72](https://github.com/JiangJie/happy-opfs/blob/4af0ec94e963041b297916e2971f6a01ca677a5c/src/fs/opfs_ext.ts#L72)
