[**happy-opfs**](../README.md)

***

[happy-opfs](../README.md) / SyncMessenger

# Class: SyncMessenger

Defined in: [worker/shared.ts:127](https://github.com/JiangJie/happy-opfs/blob/318f46cfcd998ebd962bc0e9335ea2aaef290cf7/src/worker/shared.ts#L127)

Inspired by [memfs](https://github.com/streamich/memfs/blob/master/src/fsa-to-node/worker/SyncMessenger.ts).

Used both in main thread and worker thread.

## Constructors

### new SyncMessenger()

```ts
new SyncMessenger(sab): SyncMessenger
```

Defined in: [worker/shared.ts:137](https://github.com/JiangJie/happy-opfs/blob/318f46cfcd998ebd962bc0e9335ea2aaef290cf7/src/worker/shared.ts#L137)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `sab` | `SharedArrayBuffer` |

#### Returns

[`SyncMessenger`](SyncMessenger.md)

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="headerlength"></a> `headerLength` | `readonly` | `number` | [worker/shared.ts:133](https://github.com/JiangJie/happy-opfs/blob/318f46cfcd998ebd962bc0e9335ea2aaef290cf7/src/worker/shared.ts#L133) |
| <a id="i32a"></a> `i32a` | `readonly` | `Int32Array` | [worker/shared.ts:129](https://github.com/JiangJie/happy-opfs/blob/318f46cfcd998ebd962bc0e9335ea2aaef290cf7/src/worker/shared.ts#L129) |
| <a id="maxdatalength"></a> `maxDataLength` | `readonly` | `number` | [worker/shared.ts:135](https://github.com/JiangJie/happy-opfs/blob/318f46cfcd998ebd962bc0e9335ea2aaef290cf7/src/worker/shared.ts#L135) |
| <a id="u8a"></a> `u8a` | `readonly` | `Uint8Array` | [worker/shared.ts:131](https://github.com/JiangJie/happy-opfs/blob/318f46cfcd998ebd962bc0e9335ea2aaef290cf7/src/worker/shared.ts#L131) |
