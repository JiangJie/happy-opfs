[**happy-opfs**](../README.md) • **Docs**

***

[happy-opfs](../README.md) / zip

# Function: zip()

```ts
function zip(
   sourcePath, 
   zipFilePath, 
   options?): AsyncVoidIOResult
```

Zip a file or directory.
Equivalent to `zip -r <zipFilePath> <targetPath>`.

Use [fflate](https://github.com/101arrowz/fflate) as the zip backend.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `sourcePath` | `string` | The path to be zipped. |
| `zipFilePath` | `string` | The path to the zip file. |
| `options`? | [`ZipOptions`](../interfaces/ZipOptions.md) | Options of zip. |

## Returns

`AsyncVoidIOResult`

A promise that resolves to an `AsyncIOResult` indicating whether the source was successfully zipped.

## Defined in

[fs/opfs\_ext.ts:289](https://github.com/JiangJie/happy-opfs/blob/b6f122787c0a1042b0551ee35b286e55a132e2d7/src/fs/opfs_ext.ts#L289)
