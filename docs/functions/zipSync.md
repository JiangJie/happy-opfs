[**happy-opfs**](../README.md)

***

[happy-opfs](../README.md) / zipSync

# Function: zipSync()

Synchronous version of `zip`.
Zips a file or directory.

## Template

The return type (void when writing to file, Uint8Array when returning data).

## Param

The path to zip.

## Param

Optional destination zip file path or options.

## Param

Optional zip options.

## See

[zip](zip.md) for the async version.

## Call Signature

```ts
function zipSync(
   sourcePath, 
   zipFilePath, 
   options?): VoidIOResult
```

Defined in: [worker/opfs\_worker\_adapter.ts:538](https://github.com/JiangJie/happy-opfs/blob/dd0edb865892acc2abe55bcb047ccf0f8773705c/src/worker/opfs_worker_adapter.ts#L538)

Synchronous version of `zip`.
Zips a file or directory and writes to a zip file.

### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `sourcePath` | `string` | The path to zip. |
| `zipFilePath` | `string` | The destination zip file path. |
| `options`? | [`ZipOptions`](../interfaces/ZipOptions.md) | Optional zip options. |

### Returns

`VoidIOResult`

An `IOResult` containing the result.

A `VoidIOResult` indicating success or failure.

### Template

The return type (void when writing to file, Uint8Array when returning data).

### Param

The path to zip.

### Param

Optional destination zip file path or options.

### Param

Optional zip options.

### See

[zip](zip.md) for the async version.

## Call Signature

```ts
function zipSync(sourcePath, options?): IOResult<Uint8Array<ArrayBufferLike>>
```

Defined in: [worker/opfs\_worker\_adapter.ts:547](https://github.com/JiangJie/happy-opfs/blob/dd0edb865892acc2abe55bcb047ccf0f8773705c/src/worker/opfs_worker_adapter.ts#L547)

Synchronous version of `zip`.
Zips a file or directory and returns the zip data.

### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `sourcePath` | `string` | The path to zip. |
| `options`? | [`ZipOptions`](../interfaces/ZipOptions.md) | Optional zip options. |

### Returns

`IOResult`\<`Uint8Array`\<`ArrayBufferLike`\>\>

An `IOResult` containing the result.

An `IOResult` containing the zip data as `Uint8Array`.

### Template

The return type (void when writing to file, Uint8Array when returning data).

### Param

The path to zip.

### Param

Optional destination zip file path or options.

### Param

Optional zip options.

### See

[zip](zip.md) for the async version.
