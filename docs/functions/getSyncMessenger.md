[**happy-opfs**](../README.md)

***

[happy-opfs](../README.md) / getSyncMessenger

# Function: getSyncMessenger()

```ts
function getSyncMessenger(): SyncMessenger
```

Defined in: [worker/opfs\_worker\_adapter.ts:83](https://github.com/JiangJie/happy-opfs/blob/dd0edb865892acc2abe55bcb047ccf0f8773705c/src/worker/opfs_worker_adapter.ts#L83)

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
