[**happy-opfs**](../README.md)

***

[happy-opfs](../README.md) / getFileDataByHandle

# Function: getFileDataByHandle()

```ts
function getFileDataByHandle(handle): Promise<Uint8Array<ArrayBufferLike>>
```

Defined in: [fs/utils.ts:137](https://github.com/JiangJie/happy-opfs/blob/1ca6e66c9ddde628f35ecf68e910628f2b61ed78/src/fs/utils.ts#L137)

**`Internal`**

Reads the binary data from a file handle.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `handle` | `FileSystemFileHandle` | The `FileSystemFileHandle` to read from. |

## Returns

`Promise`\<`Uint8Array`\<`ArrayBufferLike`\>\>

A promise that resolves to the file content as a `Uint8Array`.
