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

[worker/opfs\_worker\_adapter.ts:104](https://github.com/JiangJie/happy-opfs/blob/6253d25d45ee43710777316ce4d92b062d8744f7/src/worker/opfs_worker_adapter.ts#L104)

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

[worker/opfs\_worker\_adapter.ts:107](https://github.com/JiangJie/happy-opfs/blob/6253d25d45ee43710777316ce4d92b062d8744f7/src/worker/opfs_worker_adapter.ts#L107)

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

[worker/opfs\_worker\_adapter.ts:110](https://github.com/JiangJie/happy-opfs/blob/6253d25d45ee43710777316ce4d92b062d8744f7/src/worker/opfs_worker_adapter.ts#L110)
