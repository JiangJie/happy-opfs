[**happy-opfs**](../README.md)

***

[happy-opfs](../README.md) / getFileDataByHandle

# Function: getFileDataByHandle()

```ts
function getFileDataByHandle(handle): Promise<Uint8Array<ArrayBufferLike>>
```

Defined in: [fs/utils.ts:137](https://github.com/JiangJie/happy-opfs/blob/dd0edb865892acc2abe55bcb047ccf0f8773705c/src/fs/utils.ts#L137)

**`Internal`**

Reads the binary data from a file handle.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `handle` | `FileSystemFileHandle` | The `FileSystemFileHandle` to read from. |

## Returns

`Promise`\<`Uint8Array`\<`ArrayBufferLike`\>\>

A promise that resolves to the file content as a `Uint8Array`.
