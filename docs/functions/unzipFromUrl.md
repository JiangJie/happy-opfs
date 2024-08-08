[**happy-opfs**](../README.md) • **Docs**

***

[happy-opfs](../README.md) / unzipFromUrl

# Function: unzipFromUrl()

```ts
function unzipFromUrl(
   zipFileUrl, 
   targetPath, 
   requestInit?): AsyncVoidIOResult
```

Unzip a remote zip file to a directory.
Equivalent to `unzip -o <zipFilePath> -d <targetPath>

Use [fflate](https://github.com/101arrowz/fflate) as the unzip backend.
@param zipFileUrl - Zip file url.
@param targetPath - The directory to unzip to.
@param requestInit - Optional request initialization parameters.
@returns A promise that resolves to an `AsyncIOResult` indicating whether the zip file was successfully unzipped.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `zipFileUrl` | `string` |
| `targetPath` | `string` |
| `requestInit`? | [`FsRequestInit`](../type-aliases/FsRequestInit.md) |

## Returns

`AsyncVoidIOResult`

## Defined in

[fs/opfs\_unzip.ts:74](https://github.com/JiangJie/happy-opfs/blob/6e8cfb02baa55aecdbfe9b09b83e8895a321cf4e/src/fs/opfs_unzip.ts#L74)
