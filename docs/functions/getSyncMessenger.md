[**happy-opfs**](../README.md)

***

[happy-opfs](../README.md) / getSyncMessenger

# Function: getSyncMessenger()

```ts
function getSyncMessenger(): SyncMessenger
```

Defined in: [worker/opfs\_worker\_adapter.ts:82](https://github.com/JiangJie/happy-opfs/blob/1ca6e66c9ddde628f35ecf68e910628f2b61ed78/src/worker/opfs_worker_adapter.ts#L82)

Gets the current sync messenger instance.
Can be used to share the messenger with other environments.

## Returns

[`SyncMessenger`](../classes/SyncMessenger.md)

The `SyncMessenger` instance, or `undefined` if not connected.

## Example

```typescript
const messenger = getSyncMessenger();
// Pass to another context
otherContext.setSyncMessenger(messenger);
```
