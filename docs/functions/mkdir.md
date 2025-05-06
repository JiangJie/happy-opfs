[**happy-opfs**](../README.md)

***

[happy-opfs](../README.md) / mkdir

# Function: mkdir()

```ts
function mkdir(dirPath): AsyncVoidIOResult
```

Defined in: [fs/opfs\_core.ts:31](https://github.com/JiangJie/happy-opfs/blob/7d6f4902eef2f34868c7991f5501261a1d1ff67a/src/fs/opfs_core.ts#L31)

Creates a new directory at the specified path same as `mkdir -p`.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `dirPath` | `string` | The path where the new directory will be created. |

## Returns

`AsyncVoidIOResult`

A promise that resolves to an `AsyncIOResult` indicating whether the directory was successfully created.
