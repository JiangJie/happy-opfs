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
| `handle` | `FileSystemFileHandle` | The file handle. |

## Returns

`Promise`\<`Uint8Array`\>

A promise that resolves to the data of the file.

## Defined in

[fs/utils.ts:97](https://github.com/JiangJie/happy-opfs/blob/7bfec3b71684ddcf0fe3092672c66c9664776bcc/src/fs/utils.ts#L97)
