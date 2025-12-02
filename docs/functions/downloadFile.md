[**happy-opfs**](../README.md)

***

[happy-opfs](../README.md) / downloadFile

# Function: downloadFile()

## Call Signature

```ts
function downloadFile(fileUrl, requestInit?): FetchTask<DownloadFileTempResponse>
```

Defined in: [fs/opfs\_download.ts:18](https://github.com/JiangJie/happy-opfs/blob/318f46cfcd998ebd962bc0e9335ea2aaef290cf7/src/fs/opfs_download.ts#L18)

Downloads a file from a URL and saves it to a temporary file.
The returned response will contain the temporary file path.

### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `fileUrl` | `string` | The URL of the file to download. |
| `requestInit`? | [`FsRequestInit`](../type-aliases/FsRequestInit.md) | Optional request initialization parameters. |

### Returns

`FetchTask`\<[`DownloadFileTempResponse`](../interfaces/DownloadFileTempResponse.md)\>

A task that can be aborted and contains the result of the download.

## Call Signature

```ts
function downloadFile(
   fileUrl, 
   filePath, 
requestInit?): FetchTask<Response>
```

Defined in: [fs/opfs\_download.ts:27](https://github.com/JiangJie/happy-opfs/blob/318f46cfcd998ebd962bc0e9335ea2aaef290cf7/src/fs/opfs_download.ts#L27)

Downloads a file from a URL and saves it to the specified path.

### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `fileUrl` | `string` | The URL of the file to download. |
| `filePath` | `string` | The path where the downloaded file will be saved. |
| `requestInit`? | [`FsRequestInit`](../type-aliases/FsRequestInit.md) | Optional request initialization parameters. |

### Returns

`FetchTask`\<`Response`\>

A task that can be aborted and contains the result of the download.
