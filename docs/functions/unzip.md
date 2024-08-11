[**happy-opfs**](../README.md) • **Docs**

***

[happy-opfs](../README.md) / unzip

# Function: unzip()

```ts
function unzip(zipFilePath, targetPath): AsyncVoidIOResult
```

Unzip a zip file to a directory.
Equivalent to `unzip -o <zipFilePath> -d <targetPath>

Use [fflate](https://github.com/101arrowz/fflate) as the unzip backend.
@param zipFilePath - Zip file path.
@param targetPath - The directory to unzip to.
@returns A promise that resolves to an `AsyncIOResult` indicating whether the zip file was successfully unzipped.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `zipFilePath` | `string` |
| `targetPath` | `string` |

## Returns

`AsyncVoidIOResult`

## Defined in

[fs/opfs\_unzip.ts:53](https://github.com/JiangJie/happy-opfs/blob/7bfec3b71684ddcf0fe3092672c66c9664776bcc/src/fs/opfs_unzip.ts#L53)
