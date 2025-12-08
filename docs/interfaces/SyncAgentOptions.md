[**happy-opfs**](../README.md)

***

[happy-opfs](../README.md) / SyncAgentOptions

# Interface: SyncAgentOptions

Defined in: [fs/defines.ts:223](https://github.com/JiangJie/happy-opfs/blob/1ca6e66c9ddde628f35ecf68e910628f2b61ed78/src/fs/defines.ts#L223)

Setup options for `connectSyncAgent`.

## Properties

| Property | Type | Default value | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="bufferlength"></a> `bufferLength?` | `number` | `1048576` (1MB) | The size of the `SharedArrayBuffer` in bytes. Larger buffers can handle larger file operations but consume more memory. Must be a multiple of 4 and greater than 16. | [fs/defines.ts:236](https://github.com/JiangJie/happy-opfs/blob/1ca6e66c9ddde628f35ecf68e910628f2b61ed78/src/fs/defines.ts#L236) |
| <a id="optimeout"></a> `opTimeout?` | `number` | `1000` (1 second) | The timeout for each synchronous operation in milliseconds. If an operation takes longer than this, a `TimeoutError` is thrown. | [fs/defines.ts:243](https://github.com/JiangJie/happy-opfs/blob/1ca6e66c9ddde628f35ecf68e910628f2b61ed78/src/fs/defines.ts#L243) |
| <a id="worker"></a> `worker` | `string` \| `Worker` \| `URL` | `undefined` | The worker to communicate with. Can be a `Worker` instance, a `URL`, or a URL string. | [fs/defines.ts:228](https://github.com/JiangJie/happy-opfs/blob/1ca6e66c9ddde628f35ecf68e910628f2b61ed78/src/fs/defines.ts#L228) |
