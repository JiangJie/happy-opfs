[**happy-opfs**](../README.md)

***

[happy-opfs](../README.md) / SyncMessenger

# Class: SyncMessenger

Defined in: [worker/shared.ts:157](https://github.com/JiangJie/happy-opfs/blob/1ca6e66c9ddde628f35ecf68e910628f2b61ed78/src/worker/shared.ts#L157)

Messenger for synchronous communication between main thread and worker thread.
Inspired by [memfs](https://github.com/streamich/memfs/blob/master/src/fsa-to-node/worker/SyncMessenger.ts).

Uses a `SharedArrayBuffer` with lock-based synchronization via `Atomics`.
The buffer layout is:
- Bytes 0-3: Main thread lock (Int32)
- Bytes 4-7: Worker thread lock (Int32)
- Bytes 8-11: Data length (Int32)
- Bytes 12-15: Reserved
- Bytes 16+: Payload data

## Example

```typescript
const sab = new SharedArrayBuffer(1024 * 1024);
const messenger = new SyncMessenger(sab);
```

## Constructors

### new SyncMessenger()

```ts
new SyncMessenger(sab): SyncMessenger
```

Defined in: [worker/shared.ts:172](https://github.com/JiangJie/happy-opfs/blob/1ca6e66c9ddde628f35ecf68e910628f2b61ed78/src/worker/shared.ts#L172)

Creates a new SyncMessenger.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `sab` | `SharedArrayBuffer` | The SharedArrayBuffer to use for communication. |

#### Returns

[`SyncMessenger`](SyncMessenger.md)

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="headerlength"></a> `headerLength` | `readonly` | `number` | Header size in bytes (4 Int32 values = 16 bytes). | [worker/shared.ts:163](https://github.com/JiangJie/happy-opfs/blob/1ca6e66c9ddde628f35ecf68e910628f2b61ed78/src/worker/shared.ts#L163) |
| <a id="i32a"></a> `i32a` | `readonly` | `Int32Array` | Int32 view for lock operations. | [worker/shared.ts:159](https://github.com/JiangJie/happy-opfs/blob/1ca6e66c9ddde628f35ecf68e910628f2b61ed78/src/worker/shared.ts#L159) |
| <a id="maxdatalength"></a> `maxDataLength` | `readonly` | `number` | Maximum payload size in bytes. | [worker/shared.ts:165](https://github.com/JiangJie/happy-opfs/blob/1ca6e66c9ddde628f35ecf68e910628f2b61ed78/src/worker/shared.ts#L165) |
| <a id="u8a"></a> `u8a` | `readonly` | `Uint8Array` | Uint8 view for reading/writing binary payload. | [worker/shared.ts:161](https://github.com/JiangJie/happy-opfs/blob/1ca6e66c9ddde628f35ecf68e910628f2b61ed78/src/worker/shared.ts#L161) |
