[**happy-opfs**](../README.md)

***

[happy-opfs](../README.md) / setSyncMessenger

# Function: setSyncMessenger()

```ts
function setSyncMessenger(syncMessenger): void
```

Defined in: [worker/opfs\_worker\_adapter.ts:99](https://github.com/JiangJie/happy-opfs/blob/1ca6e66c9ddde628f35ecf68e910628f2b61ed78/src/worker/opfs_worker_adapter.ts#L99)

Sets the sync messenger instance.
Used to share a messenger from another environment.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `syncMessenger` | [`SyncMessenger`](../classes/SyncMessenger.md) | The `SyncMessenger` instance to use. |

## Returns

`void`

## Throws

If syncMessenger is null or undefined.

## Example

```typescript
// Receive messenger from main context
setSyncMessenger(receivedMessenger);
// Now sync APIs can be used
```
