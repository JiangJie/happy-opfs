[**happy-opfs**](../index.md) • **Docs**

***

[happy-opfs](../index.md) / downloadFile

# Function: downloadFile()

```ts
function downloadFile(
   fileUrl, 
   filePath, 
requestInit?): AsyncIOResult<boolean>
```

Downloads a file from a URL and saves it to the specified path.

## Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `fileUrl` | `string` | The URL of the file to download. |
| `filePath` | `string` | The path where the downloaded file will be saved. |
| `requestInit`? | `RequestInit` | Optional request initialization parameters. |

## Returns

`AsyncIOResult`\<`boolean`\>

A promise that resolves to an `AsyncIOResult` indicating whether the file was successfully downloaded and saved.

## Source

[fs/opfs\_ext.ts:125](https://github.com/JiangJie/happy-opfs/blob/80a97ca3a4288ae6abeed9ee9e10ef7f0d31fc68/src/fs/opfs_ext.ts#L125)
