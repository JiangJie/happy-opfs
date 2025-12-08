[**happy-opfs**](../README.md)

***

[happy-opfs](../README.md) / startSyncAgent

# Function: startSyncAgent()

```ts
function startSyncAgent(): void
```

Defined in: [worker/opfs\_worker.ts:64](https://github.com/JiangJie/happy-opfs/blob/dd0edb865892acc2abe55bcb047ccf0f8773705c/src/worker/opfs_worker.ts#L64)

Starts the sync agent in a Web Worker.
Listens for a SharedArrayBuffer from the main thread and begins processing requests.

## Returns

`void`

## Throws

If called outside a Worker context or if already started.

## Example

```typescript
// In worker.js
import { startSyncAgent } from 'happy-opfs';
startSyncAgent();
```
