[**happy-opfs**](../README.md) • **Docs**

***

[happy-opfs](../README.md) / zip

# Function: zip()

## zip(sourcePath, zipFilePath, options)

```ts
function zip(
   sourcePath, 
   zipFilePath, 
   options?): AsyncVoidIOResult
```

Zip a file or directory and write to a zip file.
Equivalent to `zip -r <zipFilePath> <targetPath>`.

Use [fflate](https://github.com/101arrowz/fflate) as the zip backend.

### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `sourcePath` | `string` | The path to be zipped. |
| `zipFilePath` | `string` | The path to the zip file. |
| `options`? | [`ZipOptions`](../interfaces/ZipOptions.md) | Options of zip. |

### Returns

`AsyncVoidIOResult`

A promise that resolves to an `AsyncIOResult` indicating whether the source was successfully zipped.

### Defined in

[fs/opfs\_zip.ts:49](https://github.com/JiangJie/happy-opfs/blob/a4847fb43bf2d37df760679e172324cb91fbf2ca/src/fs/opfs_zip.ts#L49)

## zip(sourcePath, options)

```ts
function zip(sourcePath, options?): AsyncIOResult<Uint8Array>
```

Zip a file or directory and return the zip file data.
Equivalent to `zip -r <zipFilePath> <targetPath>`.

Use [fflate](https://github.com/101arrowz/fflate) as the zip backend.

### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `sourcePath` | `string` | The path to be zipped. |
| `options`? | [`ZipOptions`](../interfaces/ZipOptions.md) | Options of zip. |

### Returns

`AsyncIOResult`\<`Uint8Array`\>

A promise that resolves to an `AsyncIOResult` indicating whether the source was successfully zipped.

### Defined in

[fs/opfs\_zip.ts:60](https://github.com/JiangJie/happy-opfs/blob/a4847fb43bf2d37df760679e172324cb91fbf2ca/src/fs/opfs_zip.ts#L60)
