[**happy-opfs**](../README.md)

***

[happy-opfs](../README.md) / zipFromUrl

# Function: zipFromUrl()

## Call Signature

```ts
function zipFromUrl(
   sourceUrl, 
   zipFilePath, 
   requestInit?): AsyncVoidIOResult
```

Defined in: [fs/opfs\_zip.ts:122](https://github.com/JiangJie/happy-opfs/blob/1ca6e66c9ddde628f35ecf68e910628f2b61ed78/src/fs/opfs_zip.ts#L122)

Zip a remote file and write to a zip file.

Use [fflate](https://github.com/101arrowz/fflate) as the zip backend.

### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `sourceUrl` | `string` | The url to be zipped. |
| `zipFilePath` | `string` | The path to the zip file. |
| `requestInit`? | [`FsRequestInit`](../type-aliases/FsRequestInit.md) | Optional request initialization parameters. |

### Returns

`AsyncVoidIOResult`

A promise that resolves to an `AsyncIOResult` indicating whether the source was successfully zipped.

## Call Signature

```ts
function zipFromUrl(sourceUrl, requestInit?): AsyncIOResult<Uint8Array<ArrayBufferLike>>
```

Defined in: [fs/opfs\_zip.ts:132](https://github.com/JiangJie/happy-opfs/blob/1ca6e66c9ddde628f35ecf68e910628f2b61ed78/src/fs/opfs_zip.ts#L132)

Zip a remote file and return the zip file data.

Use [fflate](https://github.com/101arrowz/fflate) as the zip backend.

### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `sourceUrl` | `string` | The url to be zipped. |
| `requestInit`? | [`FsRequestInit`](../type-aliases/FsRequestInit.md) | Optional request initialization parameters. |

### Returns

`AsyncIOResult`\<`Uint8Array`\<`ArrayBufferLike`\>\>

A promise that resolves to an `AsyncIOResult` indicating whether the source was successfully zipped.
