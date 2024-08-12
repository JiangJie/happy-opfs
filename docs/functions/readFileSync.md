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

[worker/opfs\_worker\_adapter.ts:118](https://github.com/JiangJie/happy-opfs/blob/1fc39add615fcd3c1ee38b13edeb0d38cd3481c4/src/worker/opfs_worker_adapter.ts#L118)

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

[worker/opfs\_worker\_adapter.ts:121](https://github.com/JiangJie/happy-opfs/blob/1fc39add615fcd3c1ee38b13edeb0d38cd3481c4/src/worker/opfs_worker_adapter.ts#L121)

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

[worker/opfs\_worker\_adapter.ts:124](https://github.com/JiangJie/happy-opfs/blob/1fc39add615fcd3c1ee38b13edeb0d38cd3481c4/src/worker/opfs_worker_adapter.ts#L124)
