[**happy-opfs**](../README.md)

***

[happy-opfs](../README.md) / existsSync

# Function: existsSync()

```ts
function existsSync(path, options?): IOResult<boolean>
```

Defined in: [worker/opfs\_worker\_adapter.ts:411](https://github.com/JiangJie/happy-opfs/blob/dd0edb865892acc2abe55bcb047ccf0f8773705c/src/worker/opfs_worker_adapter.ts#L411)

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
