[**happy-opfs**](../README.md) • **Docs**

***

[happy-opfs](../README.md) / zipFromUrl

# Function: zipFromUrl()

## zipFromUrl(sourceUrl, zipFilePath, requestInit)

```ts
function zipFromUrl(
   sourceUrl, 
   zipFilePath, 
   requestInit?): AsyncVoidIOResult
```

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

### Defined in

[fs/opfs\_zip.ts:117](https://github.com/JiangJie/happy-opfs/blob/6e8cfb02baa55aecdbfe9b09b83e8895a321cf4e/src/fs/opfs_zip.ts#L117)

## zipFromUrl(sourceUrl, requestInit)

```ts
function zipFromUrl(sourceUrl, requestInit?): AsyncIOResult<Uint8Array>
```

Zip a remote file and return the zip file data.

Use [fflate](https://github.com/101arrowz/fflate) as the zip backend.

### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `sourceUrl` | `string` | The url to be zipped. |
| `requestInit`? | [`FsRequestInit`](../type-aliases/FsRequestInit.md) | Optional request initialization parameters. |

### Returns

`AsyncIOResult`\<`Uint8Array`\>

A promise that resolves to an `AsyncIOResult` indicating whether the source was successfully zipped.

### Defined in

[fs/opfs\_zip.ts:127](https://github.com/JiangJie/happy-opfs/blob/6e8cfb02baa55aecdbfe9b09b83e8895a321cf4e/src/fs/opfs_zip.ts#L127)
