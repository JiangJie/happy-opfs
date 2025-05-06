[**happy-opfs**](../README.md)

***

[happy-opfs](../README.md) / zipSync

# Function: zipSync()

Sync version of `zip`.

## Call Signature

```ts
function zipSync(
   sourcePath, 
   zipFilePath, 
   options?): VoidIOResult
```

Defined in: [worker/opfs\_worker\_adapter.ts:294](https://github.com/JiangJie/happy-opfs/blob/7d6f4902eef2f34868c7991f5501261a1d1ff67a/src/worker/opfs_worker_adapter.ts#L294)

Sync version of `zip`.

### Parameters

| Parameter | Type |
| ------ | ------ |
| `sourcePath` | `string` |
| `zipFilePath` | `string` |
| `options`? | [`ZipOptions`](../interfaces/ZipOptions.md) |

### Returns

`VoidIOResult`

## Call Signature

```ts
function zipSync(sourcePath, options?): IOResult<Uint8Array<ArrayBufferLike>>
```

Defined in: [worker/opfs\_worker\_adapter.ts:299](https://github.com/JiangJie/happy-opfs/blob/7d6f4902eef2f34868c7991f5501261a1d1ff67a/src/worker/opfs_worker_adapter.ts#L299)

Sync version of `zip`.

### Parameters

| Parameter | Type |
| ------ | ------ |
| `sourcePath` | `string` |
| `options`? | [`ZipOptions`](../interfaces/ZipOptions.md) |

### Returns

`IOResult`\<`Uint8Array`\<`ArrayBufferLike`\>\>
