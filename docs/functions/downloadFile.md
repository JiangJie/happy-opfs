[**happy-opfs**](../README.md) • **Docs**

***

[happy-opfs](../README.md) / downloadFile

# Function: downloadFile()

## downloadFile(fileUrl, requestInit)

```ts
function downloadFile(fileUrl, requestInit?): FetchTask<DownloadFileTempResponse>
```

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

### Defined in

[fs/opfs\_download.ts:18](https://github.com/JiangJie/happy-opfs/blob/7bfec3b71684ddcf0fe3092672c66c9664776bcc/src/fs/opfs_download.ts#L18)

## downloadFile(fileUrl, filePath, requestInit)

```ts
function downloadFile(
   fileUrl, 
   filePath, 
requestInit?): FetchTask<Response>
```

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

### Defined in

[fs/opfs\_download.ts:27](https://github.com/JiangJie/happy-opfs/blob/7bfec3b71684ddcf0fe3092672c66c9664776bcc/src/fs/opfs_download.ts#L27)
