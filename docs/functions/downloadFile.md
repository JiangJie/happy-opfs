[**happy-opfs**](../README.md) • **Docs**

***

[happy-opfs](../README.md) / downloadFile

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

[fs/opfs\_ext.ts:125](https://github.com/JiangJie/happy-opfs/blob/fcbf5b5ef2676cbf90b3a855acdadcf7a79ef72c/src/fs/opfs_ext.ts#L125)
