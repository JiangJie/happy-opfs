[**happy-opfs**](../README.md)

***

[happy-opfs](../README.md) / downloadFile

# Function: downloadFile()

## Call Signature

```ts
function downloadFile(fileUrl, requestInit?): FetchTask<DownloadFileTempResponse>
```

Defined in: [fs/opfs\_download.ts:35](https://github.com/JiangJie/happy-opfs/blob/dd0edb865892acc2abe55bcb047ccf0f8773705c/src/fs/opfs_download.ts#L35)

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

Defined in: [fs/opfs\_download.ts:44](https://github.com/JiangJie/happy-opfs/blob/dd0edb865892acc2abe55bcb047ccf0f8773705c/src/fs/opfs_download.ts#L44)

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
