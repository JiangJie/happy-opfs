[**happy-opfs**](../README.md)

***

[happy-opfs](../README.md) / zip

# Function: zip()

## Call Signature

```ts
function zip(
   sourcePath, 
   zipFilePath, 
   options?): AsyncVoidIOResult
```

Defined in: [fs/opfs\_zip.ts:49](https://github.com/JiangJie/happy-opfs/blob/7d6f4902eef2f34868c7991f5501261a1d1ff67a/src/fs/opfs_zip.ts#L49)

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

## Call Signature

```ts
function zip(sourcePath, options?): AsyncIOResult<Uint8Array<ArrayBufferLike>>
```

Defined in: [fs/opfs\_zip.ts:60](https://github.com/JiangJie/happy-opfs/blob/7d6f4902eef2f34868c7991f5501261a1d1ff67a/src/fs/opfs_zip.ts#L60)

Zip a file or directory and return the zip file data.
Equivalent to `zip -r <zipFilePath> <targetPath>`.

Use [fflate](https://github.com/101arrowz/fflate) as the zip backend.

### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `sourcePath` | `string` | The path to be zipped. |
| `options`? | [`ZipOptions`](../interfaces/ZipOptions.md) | Options of zip. |

### Returns

`AsyncIOResult`\<`Uint8Array`\<`ArrayBufferLike`\>\>

A promise that resolves to an `AsyncIOResult` indicating whether the source was successfully zipped.
