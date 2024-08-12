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

[fs/opfs\_unzip.ts:51](https://github.com/JiangJie/happy-opfs/blob/1fc39add615fcd3c1ee38b13edeb0d38cd3481c4/src/fs/opfs_unzip.ts#L51)
