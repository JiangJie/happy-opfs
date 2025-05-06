[**happy-opfs**](../README.md)

***

[happy-opfs](../README.md) / readFileSync

# Function: readFileSync()

## Call Signature

```ts
function readFileSync(filePath, options): IOResult<FileLike>
```

Defined in: [worker/opfs\_worker\_adapter.ts:139](https://github.com/JiangJie/happy-opfs/blob/7d6f4902eef2f34868c7991f5501261a1d1ff67a/src/worker/opfs_worker_adapter.ts#L139)

Sync version of `readFile`.

### Parameters

| Parameter | Type |
| ------ | ------ |
| `filePath` | `string` |
| `options` | [`ReadOptions`](../interfaces/ReadOptions.md) & \{ `encoding`: `"blob"`; \} |

### Returns

`IOResult`\<[`FileLike`](../interfaces/FileLike.md)\>

## Call Signature

```ts
function readFileSync(filePath, options): IOResult<string>
```

Defined in: [worker/opfs\_worker\_adapter.ts:142](https://github.com/JiangJie/happy-opfs/blob/7d6f4902eef2f34868c7991f5501261a1d1ff67a/src/worker/opfs_worker_adapter.ts#L142)

Sync version of `readFile`.

### Parameters

| Parameter | Type |
| ------ | ------ |
| `filePath` | `string` |
| `options` | [`ReadOptions`](../interfaces/ReadOptions.md) & \{ `encoding`: `"utf8"`; \} |

### Returns

`IOResult`\<`string`\>

## Call Signature

```ts
function readFileSync(filePath, options?): IOResult<ArrayBuffer>
```

Defined in: [worker/opfs\_worker\_adapter.ts:145](https://github.com/JiangJie/happy-opfs/blob/7d6f4902eef2f34868c7991f5501261a1d1ff67a/src/worker/opfs_worker_adapter.ts#L145)

Sync version of `readFile`.

### Parameters

| Parameter | Type |
| ------ | ------ |
| `filePath` | `string` |
| `options`? | [`ReadOptions`](../interfaces/ReadOptions.md) & \{ `encoding`: `"binary"`; \} |

### Returns

`IOResult`\<`ArrayBuffer`\>
