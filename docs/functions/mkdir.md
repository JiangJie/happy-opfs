[**happy-opfs**](../README.md) • **Docs**

***

[happy-opfs](../README.md) / mkdir

# Function: mkdir()

```ts
function mkdir(dirPath): AsyncVoidIOResult
```

Creates a new directory at the specified path same as `mkdir -p`.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `dirPath` | `string` | The path where the new directory will be created. |

## Returns

`AsyncVoidIOResult`

A promise that resolves to an `AsyncIOResult` indicating whether the directory was successfully created.

## Defined in

[fs/opfs\_core.ts:31](https://github.com/JiangJie/happy-opfs/blob/7bfec3b71684ddcf0fe3092672c66c9664776bcc/src/fs/opfs_core.ts#L31)
