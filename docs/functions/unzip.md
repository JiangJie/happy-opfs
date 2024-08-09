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

[fs/opfs\_unzip.ts:53](https://github.com/JiangJie/happy-opfs/blob/a4847fb43bf2d37df760679e172324cb91fbf2ca/src/fs/opfs_unzip.ts#L53)
