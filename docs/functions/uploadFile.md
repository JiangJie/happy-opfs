[**happy-opfs**](../index.md) • **Docs**

***

[happy-opfs](../index.md) / uploadFile

# Function: uploadFile()

```ts
function uploadFile(
   filePath, 
   fileUrl, 
requestInit?): AsyncIOResult<boolean>
```

Uploads a file from the specified path to a URL.

## Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `filePath` | `string` | The path of the file to upload. |
| `fileUrl` | `string` | The URL where the file will be uploaded. |
| `requestInit`? | `RequestInit` | Optional request initialization parameters. |

## Returns

`AsyncIOResult`\<`boolean`\>

A promise that resolves to an `AsyncIOResult` indicating whether the file was successfully uploaded.

## Source

[fs/opfs\_ext.ts:156](https://github.com/JiangJie/happy-opfs/blob/80a97ca3a4288ae6abeed9ee9e10ef7f0d31fc68/src/fs/opfs_ext.ts#L156)
