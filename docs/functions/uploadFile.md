[**happy-opfs**](../README.md) • **Docs**

***

[happy-opfs](../README.md) / uploadFile

# Function: uploadFile()

```ts
function uploadFile(
   filePath, 
   fileUrl, 
requestInit?): FetchTask<Response>
```

Uploads a file from the specified path to a URL.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `filePath` | `string` | The path of the file to upload. |
| `fileUrl` | `string` | The URL where the file will be uploaded. |
| `requestInit`? | [`UploadRequestInit`](../interfaces/UploadRequestInit.md) | Optional request initialization parameters. |

## Returns

`FetchTask`\<`Response`\>

A promise that resolves to an `AsyncIOResult` indicating whether the file was successfully uploaded.

## Defined in

[fs/opfs\_ext.ts:189](https://github.com/JiangJie/happy-opfs/blob/e9fb685299dadc4e6e669ad2019dbf147a8f564a/src/fs/opfs_ext.ts#L189)
