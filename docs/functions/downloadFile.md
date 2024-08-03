[**happy-opfs**](../README.md) • **Docs**

***

[happy-opfs](../README.md) / downloadFile

# Function: downloadFile()

```ts
function downloadFile(
   fileUrl, 
   filePath, 
requestInit?): FetchTask<Response>
```

Downloads a file from a URL and saves it to the specified path.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `fileUrl` | `string` | The URL of the file to download. |
| `filePath` | `string` | The path where the downloaded file will be saved. |
| `requestInit`? | [`FsRequestInit`](../interfaces/FsRequestInit.md) | Optional request initialization parameters. |

## Returns

`FetchTask`\<`Response`\>

A promise that resolves to an `AsyncIOResult` indicating whether the file was successfully downloaded and saved.

## Defined in

[fs/opfs\_ext.ts:115](https://github.com/JiangJie/happy-opfs/blob/584e221ed8f9c25f1e723b7898a60bc25fe8652b/src/fs/opfs_ext.ts#L115)
