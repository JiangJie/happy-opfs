[**happy-opfs**](../README.md)

***

[happy-opfs](../README.md) / connectSyncAgent

# Function: connectSyncAgent()

```ts
function connectSyncAgent(options): Promise<void>
```

Defined in: [worker/opfs\_worker\_adapter.ts:29](https://github.com/JiangJie/happy-opfs/blob/1ca6e66c9ddde628f35ecf68e910628f2b61ed78/src/worker/opfs_worker_adapter.ts#L29)

Connects to a sync agent worker for synchronous file system operations.
Must be called before using any sync API functions.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `options` | [`SyncAgentOptions`](../interfaces/SyncAgentOptions.md) | Configuration options for the sync agent. |

## Returns

`Promise`\<`void`\>

A promise that resolves when the worker is ready.

## Throws

If called outside the main thread or if already connected.

## Example

```typescript
await connectSyncAgent({
    worker: new URL('./worker.js', import.meta.url),
    bufferLength: 1024 * 1024,
    opTimeout: 5000,
});
```
