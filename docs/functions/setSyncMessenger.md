[**happy-opfs**](../README.md)

***

[happy-opfs](../README.md) / setSyncMessenger

# Function: setSyncMessenger()

```ts
function setSyncMessenger(syncMessenger): void
```

Defined in: [worker/opfs\_worker\_adapter.ts:100](https://github.com/JiangJie/happy-opfs/blob/dd0edb865892acc2abe55bcb047ccf0f8773705c/src/worker/opfs_worker_adapter.ts#L100)

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
