[**happy-opfs**](../README.md) • **Docs**

***

[happy-opfs](../README.md) / readFileSync

# Function: readFileSync()

## readFileSync(filePath, options)

```ts
function readFileSync(filePath, options): IOResult<FileLike>
```

Sync version of `readFile`.

### Parameters

| Parameter | Type |
| ------ | ------ |
| `filePath` | `string` |
| `options` | [`ReadOptions`](../interfaces/ReadOptions.md) & \{ `encoding`: `"blob"`; \} |

### Returns

`IOResult`\<[`FileLike`](../interfaces/FileLike.md)\>

### Defined in

[worker/opfs\_worker\_adapter.ts:118](https://github.com/JiangJie/happy-opfs/blob/41bfb9280ee562c4a8708809308f96d116edb112/src/worker/opfs_worker_adapter.ts#L118)

## readFileSync(filePath, options)

```ts
function readFileSync(filePath, options): IOResult<string>
```

### Parameters

| Parameter | Type |
| ------ | ------ |
| `filePath` | `string` |
| `options` | [`ReadOptions`](../interfaces/ReadOptions.md) & \{ `encoding`: `"utf8"`; \} |

### Returns

`IOResult`\<`string`\>

### Defined in

[worker/opfs\_worker\_adapter.ts:121](https://github.com/JiangJie/happy-opfs/blob/41bfb9280ee562c4a8708809308f96d116edb112/src/worker/opfs_worker_adapter.ts#L121)

## readFileSync(filePath, options)

```ts
function readFileSync(filePath, options?): IOResult<ArrayBuffer>
```

### Parameters

| Parameter | Type |
| ------ | ------ |
| `filePath` | `string` |
| `options`? | [`ReadOptions`](../interfaces/ReadOptions.md) & \{ `encoding`: `"binary"`; \} |

### Returns

`IOResult`\<`ArrayBuffer`\>

### Defined in

[worker/opfs\_worker\_adapter.ts:124](https://github.com/JiangJie/happy-opfs/blob/41bfb9280ee562c4a8708809308f96d116edb112/src/worker/opfs_worker_adapter.ts#L124)
