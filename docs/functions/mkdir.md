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
| :------ | :------ | :------ |
| `dirPath` | `string` | The path where the new directory will be created. |

## Returns

`AsyncIOResult`\<`boolean`\>

A promise that resolves to an `AsyncIOResult` indicating whether the directory was successfully created.

## Source

[fs/opfs\_core.ts:14](https://github.com/JiangJie/happy-opfs/blob/fcbf5b5ef2676cbf90b3a855acdadcf7a79ef72c/src/fs/opfs_core.ts#L14)
