[**happy-opfs**](../README.md) • **Docs**

***

[happy-opfs](../README.md) / getFileDataByHandle

# Function: getFileDataByHandle()

```ts
function getFileDataByHandle(handle): Promise<Uint8Array>
```

Gets the data of a file handle.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `handle` | `FileSystemHandle` | The file handle. |

## Returns

`Promise`\<`Uint8Array`\>

A promise that resolves to the data of the file.

## Defined in

[fs/utils.ts:57](https://github.com/JiangJie/happy-opfs/blob/b6f122787c0a1042b0551ee35b286e55a132e2d7/src/fs/utils.ts#L57)
