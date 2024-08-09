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

[worker/opfs\_worker\_adapter.ts:260](https://github.com/JiangJie/happy-opfs/blob/a4847fb43bf2d37df760679e172324cb91fbf2ca/src/worker/opfs_worker_adapter.ts#L260)

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

[worker/opfs\_worker\_adapter.ts:265](https://github.com/JiangJie/happy-opfs/blob/a4847fb43bf2d37df760679e172324cb91fbf2ca/src/worker/opfs_worker_adapter.ts#L265)
