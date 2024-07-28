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

[opfs\_ext.ts:188](https://github.com/JiangJie/happy-opfs/blob/4af0ec94e963041b297916e2971f6a01ca677a5c/src/fs/opfs_ext.ts#L188)
