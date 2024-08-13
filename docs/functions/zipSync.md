[**happy-opfs**](../README.md) • **Docs**

***

[happy-opfs](../README.md) / zipSync

# Function: zipSync()

Sync version of `zip`.

## zipSync(sourcePath, zipFilePath, options)

```ts
function zipSync(
   sourcePath, 
   zipFilePath, 
   options?): VoidIOResult
```

Sync version of `zip`.

### Parameters

| Parameter | Type |
| ------ | ------ |
| `sourcePath` | `string` |
| `zipFilePath` | `string` |
| `options`? | [`ZipOptions`](../interfaces/ZipOptions.md) |

### Returns

`VoidIOResult`

### Defined in

[worker/opfs\_worker\_adapter.ts:273](https://github.com/JiangJie/happy-opfs/blob/41bfb9280ee562c4a8708809308f96d116edb112/src/worker/opfs_worker_adapter.ts#L273)

## zipSync(sourcePath, options)

```ts
function zipSync(sourcePath, options?): IOResult<Uint8Array>
```

Sync version of `zip`.

### Parameters

| Parameter | Type |
| ------ | ------ |
| `sourcePath` | `string` |
| `options`? | [`ZipOptions`](../interfaces/ZipOptions.md) |

### Returns

`IOResult`\<`Uint8Array`\>

### Defined in

[worker/opfs\_worker\_adapter.ts:278](https://github.com/JiangJie/happy-opfs/blob/41bfb9280ee562c4a8708809308f96d116edb112/src/worker/opfs_worker_adapter.ts#L278)
