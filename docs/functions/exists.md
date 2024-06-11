[**happy-opfs**](../index.md) • **Docs**

***

[happy-opfs](../index.md) / exists

# Function: exists()

```ts
function exists(path, options?): AsyncIOResult<boolean>
```

Checks whether a file or directory exists at the specified path.

## Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `path` | `string` | The path of the file or directory to check for existence. |
| `options`? | [`ExistsOptions`](../interfaces/ExistsOptions.md) | Optional existence options. |

## Returns

`AsyncIOResult`\<`boolean`\>

A promise that resolves to an `AsyncIOResult` indicating whether the file or directory exists.

## Source

[fs/opfs\_ext.ts:70](https://github.com/JiangJie/happy-opfs/blob/80a97ca3a4288ae6abeed9ee9e10ef7f0d31fc68/src/fs/opfs_ext.ts#L70)
