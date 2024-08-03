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

[worker/opfs\_worker\_adapter.ts:103](https://github.com/JiangJie/happy-opfs/blob/ff451a853f34b3dedd716c1414a17eb57f239434/src/worker/opfs_worker_adapter.ts#L103)

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

[worker/opfs\_worker\_adapter.ts:106](https://github.com/JiangJie/happy-opfs/blob/ff451a853f34b3dedd716c1414a17eb57f239434/src/worker/opfs_worker_adapter.ts#L106)

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

[worker/opfs\_worker\_adapter.ts:109](https://github.com/JiangJie/happy-opfs/blob/ff451a853f34b3dedd716c1414a17eb57f239434/src/worker/opfs_worker_adapter.ts#L109)
