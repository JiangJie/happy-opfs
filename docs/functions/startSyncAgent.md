[**happy-opfs**](../README.md)

***

[happy-opfs](../README.md) / startSyncAgent

# Function: startSyncAgent()

```ts
function startSyncAgent(): void
```

Defined in: [worker/opfs\_worker.ts:53](https://github.com/JiangJie/happy-opfs/blob/1ca6e66c9ddde628f35ecf68e910628f2b61ed78/src/worker/opfs_worker.ts#L53)

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
