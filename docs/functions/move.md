[**happy-opfs**](../README.md)

***

[happy-opfs](../README.md) / move

# Function: move()

```ts
function move(
   srcPath, 
   destPath, 
   options?): AsyncVoidIOResult
```

Defined in: [fs/opfs\_ext.ts:202](https://github.com/JiangJie/happy-opfs/blob/7d6f4902eef2f34868c7991f5501261a1d1ff67a/src/fs/opfs_ext.ts#L202)

Move a file or directory from an old path to a new path.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `srcPath` | `string` | The current path of the file or directory. |
| `destPath` | `string` | The new path of the file or directory. |
| `options`? | [`MoveOptions`](../interfaces/MoveOptions.md) | Options of move. |

## Returns

`AsyncVoidIOResult`

A promise that resolves to an `AsyncIOResult` indicating whether the file or directory was successfully moved.
