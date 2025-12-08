[**happy-opfs**](../README.md)

***

[happy-opfs](../README.md) / existsSync

# Function: existsSync()

```ts
function existsSync(path, options?): IOResult<boolean>
```

Defined in: [worker/opfs\_worker\_adapter.ts:357](https://github.com/JiangJie/happy-opfs/blob/1ca6e66c9ddde628f35ecf68e910628f2b61ed78/src/worker/opfs_worker_adapter.ts#L357)

Synchronous version of `exists`.
Checks whether a file or directory exists at the specified path.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `path` | `string` | The absolute path to check. |
| `options`? | [`ExistsOptions`](../interfaces/ExistsOptions.md) | Optional existence options (e.g., isDirectory, isFile). |

## Returns

`IOResult`\<`boolean`\>

An `IOResult` containing `true` if exists, `false` otherwise.

## See

[exists](exists.md) for the async version.
