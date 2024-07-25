[**happy-opfs**](../README.md) • **Docs**

***

[happy-opfs](../README.md) / mkdir

# Function: mkdir()

```ts
function mkdir(dirPath): AsyncIOResult<boolean>
```

Creates a new directory at the specified path same as `mkdir -p`.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `dirPath` | `string` | The path where the new directory will be created. |

## Returns

`AsyncIOResult`\<`boolean`\>

A promise that resolves to an `AsyncIOResult` indicating whether the directory was successfully created.

## Defined in

[opfs\_core.ts:14](https://github.com/JiangJie/happy-opfs/blob/0955d4be7b0440a9e0261193bc3c402389d8f518/src/fs/opfs_core.ts#L14)
