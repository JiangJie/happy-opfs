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

[worker/opfs\_worker\_adapter.ts:147](https://github.com/JiangJie/happy-opfs/blob/e9fb685299dadc4e6e669ad2019dbf147a8f564a/src/worker/opfs_worker_adapter.ts#L147)
