[**happy-opfs**](../README.md) • **Docs**

***

[happy-opfs](../README.md) / writeFileSync

# Function: writeFileSync()

```ts
function writeFileSync(
   filePath, 
   contents, 
options?): IOResult<boolean>
```

Sync version of `writeFile`.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `filePath` | `string` |
| `contents` | [`WriteFileContent`](../type-aliases/WriteFileContent.md) |
| `options`? | [`WriteOptions`](../interfaces/WriteOptions.md) |

## Returns

`IOResult`\<`boolean`\>

## Defined in

[worker/opfs\_worker\_adapter.ts:147](https://github.com/JiangJie/happy-opfs/blob/584e221ed8f9c25f1e723b7898a60bc25fe8652b/src/worker/opfs_worker_adapter.ts#L147)
