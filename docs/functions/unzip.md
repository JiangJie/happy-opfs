[**happy-opfs**](../README.md)

***

[happy-opfs](../README.md) / unzip

# Function: unzip()

```ts
function unzip(zipFilePath, targetPath): AsyncVoidIOResult
```

Defined in: [fs/opfs\_unzip.ts:51](https://github.com/JiangJie/happy-opfs/blob/dd0edb865892acc2abe55bcb047ccf0f8773705c/src/fs/opfs_unzip.ts#L51)

Unzip a zip file to a directory.
Equivalent to `unzip -o <zipFilePath> -d <targetPath>

Use [fflate](https://github.com/101arrowz/fflate) as the unzip backend.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `zipFilePath` | `string` | Zip file path. |
| `targetPath` | `string` | The directory to unzip to. |

## Returns

`AsyncVoidIOResult`

A promise that resolves to an `AsyncIOResult` indicating whether the zip file was successfully unzipped.
