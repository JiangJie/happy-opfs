[**happy-opfs**](../README.md)

***

[happy-opfs](../README.md) / unzipFromUrl

# Function: unzipFromUrl()

```ts
function unzipFromUrl(
   zipFileUrl, 
   targetPath, 
   requestInit?): AsyncVoidIOResult
```

Defined in: [fs/opfs\_unzip.ts:71](https://github.com/JiangJie/happy-opfs/blob/7d6f4902eef2f34868c7991f5501261a1d1ff67a/src/fs/opfs_unzip.ts#L71)

Unzip a remote zip file to a directory.
Equivalent to `unzip -o <zipFilePath> -d <targetPath>

Use [fflate](https://github.com/101arrowz/fflate) as the unzip backend.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `zipFileUrl` | `string` | Zip file url. |
| `targetPath` | `string` | The directory to unzip to. |
| `requestInit`? | [`FsRequestInit`](../type-aliases/FsRequestInit.md) | Optional request initialization parameters. |

## Returns

`AsyncVoidIOResult`

A promise that resolves to an `AsyncIOResult` indicating whether the zip file was successfully unzipped.
