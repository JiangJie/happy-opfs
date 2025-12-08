[**happy-opfs**](../README.md)

***

[happy-opfs](../README.md) / SyncMessenger

# Class: SyncMessenger

Defined in: [worker/shared.ts:131](https://github.com/JiangJie/happy-opfs/blob/dd0edb865892acc2abe55bcb047ccf0f8773705c/src/worker/shared.ts#L131)

Messenger for synchronous communication between main thread and worker thread.
Inspired by [memfs](https://github.com/streamich/memfs/blob/master/src/fsa-to-node/worker/SyncMessenger.ts).

Uses a `SharedArrayBuffer` with lock-based synchronization via `Atomics`.

Buffer Layout (all values are Int32 at 4-byte boundaries):
```
Offset  Size    Field           Description
------  ----    -----           -----------
0       4       MAIN_LOCK       Main thread state (0=unlocked/ready, 1=locked/waiting)
4       4       WORKER_LOCK     Worker thread state (0=locked/idle, 1=unlocked/processing)
8       4       DATA_LENGTH     Length of payload data in bytes
12      4       RESERVED        Reserved for future use
16+     var     PAYLOAD         Actual request/response binary data
```

Communication Flow:
1. Main thread writes request to PAYLOAD, sets DATA_LENGTH
2. Main thread sets MAIN_LOCK=1 (locked), WORKER_LOCK=1 (unlocked)
3. Worker sees WORKER_LOCK=1, reads request, processes it
4. Worker writes response to PAYLOAD, sets DATA_LENGTH
5. Worker sets WORKER_LOCK=0 (locked), MAIN_LOCK=0 (unlocked)
6. Main thread sees MAIN_LOCK=0, reads response

## Example

```typescript
// Create messenger with 1MB buffer
const sab = new SharedArrayBuffer(1024 * 1024);
const messenger = new SyncMessenger(sab);
```

## Constructors

### new SyncMessenger()

```ts
new SyncMessenger(sab): SyncMessenger
```

Defined in: [worker/shared.ts:163](https://github.com/JiangJie/happy-opfs/blob/dd0edb865892acc2abe55bcb047ccf0f8773705c/src/worker/shared.ts#L163)

Creates a new SyncMessenger instance.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `sab` | `SharedArrayBuffer` | The SharedArrayBuffer to use for cross-thread communication. Must be created in the main thread and transferred to the worker. |

#### Returns

[`SyncMessenger`](SyncMessenger.md)

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="headerlength"></a> `headerLength` | `readonly` | `number` | Header size in bytes: 4 Int32 values = 16 bytes. Payload data starts after this offset. | [worker/shared.ts:148](https://github.com/JiangJie/happy-opfs/blob/dd0edb865892acc2abe55bcb047ccf0f8773705c/src/worker/shared.ts#L148) |
| <a id="i32a"></a> `i32a` | `readonly` | `Int32Array` | Int32 view for atomic lock operations. Layout: [MAIN_LOCK, WORKER_LOCK, DATA_LENGTH, RESERVED] | [worker/shared.ts:136](https://github.com/JiangJie/happy-opfs/blob/dd0edb865892acc2abe55bcb047ccf0f8773705c/src/worker/shared.ts#L136) |
| <a id="maxdatalength"></a> `maxDataLength` | `readonly` | `number` | Maximum payload size in bytes. Calculated as: total buffer size - header length. Requests/responses exceeding this limit will fail. | [worker/shared.ts:155](https://github.com/JiangJie/happy-opfs/blob/dd0edb865892acc2abe55bcb047ccf0f8773705c/src/worker/shared.ts#L155) |
| <a id="u8a"></a> `u8a` | `readonly` | `Uint8Array` | Uint8 view for reading/writing binary payload. Payload starts at offset `headerLength` (16 bytes). | [worker/shared.ts:142](https://github.com/JiangJie/happy-opfs/blob/dd0edb865892acc2abe55bcb047ccf0f8773705c/src/worker/shared.ts#L142) |
