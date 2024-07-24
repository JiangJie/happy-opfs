[**happy-opfs**](../README.md) • **Docs**

***

[happy-opfs](../README.md) / downloadFile

# Function: downloadFile()

```ts
function downloadFile(
   fileUrl, 
   filePath, 
requestInit?): AsyncIOResult<Response>
```

Downloads a file from a URL and saves it to the specified path.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `fileUrl` | `string` | The URL of the file to download. |
| `filePath` | `string` | The path where the downloaded file will be saved. |
| `requestInit`? | `RequestInit` | Optional request initialization parameters. |

## Returns

`AsyncIOResult`\<`Response`\>

A promise that resolves to an `AsyncIOResult` indicating whether the file was successfully downloaded and saved.

## Defined in

[opfs\_ext.ts:125](https://github.com/JiangJie/happy-opfs/blob/d11d148d6062aa7ef81f55cf9404bf8fd95c760b/src/fs/opfs_ext.ts#L125)
