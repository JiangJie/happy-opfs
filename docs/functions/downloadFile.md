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

[opfs\_ext.ts:126](https://github.com/JiangJie/happy-opfs/blob/fa6bc23a30a47c302610ab09429219f90b89d4ad/src/fs/opfs_ext.ts#L126)
