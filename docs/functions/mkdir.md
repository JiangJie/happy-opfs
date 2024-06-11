[**happy-opfs**](../index.md) • **Docs**

***

[happy-opfs](../index.md) / mkdir

# Function: mkdir()

```ts
function mkdir(dirPath): AsyncIOResult<boolean>
```

Creates a new directory at the specified path same as `mkdir -p`.

## Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `dirPath` | `string` | The path where the new directory will be created. |

## Returns

`AsyncIOResult`\<`boolean`\>

A promise that resolves to an `AsyncIOResult` indicating whether the directory was successfully created.

## Source

[fs/opfs\_core.ts:14](https://github.com/JiangJie/happy-opfs/blob/80a97ca3a4288ae6abeed9ee9e10ef7f0d31fc68/src/fs/opfs_core.ts#L14)
