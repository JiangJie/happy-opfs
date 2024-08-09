[**happy-opfs**](../README.md) • **Docs**

***

[happy-opfs](../README.md) / copy

# Function: copy()

```ts
function copy(
   srcPath, 
   destPath, 
   options?): AsyncVoidIOResult
```

Copies a file or directory from one location to another same as `cp -r`.

Both `srcPath` and `destPath` must both be a file or directory.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `srcPath` | `string` | The source file/directory path. |
| `destPath` | `string` | The destination file/directory path. |
| `options`? | [`CopyOptions`](../interfaces/CopyOptions.md) | The copy options. |

## Returns

`AsyncVoidIOResult`

A promise that resolves to an `AsyncVoidIOResult` indicating whether the file was successfully copied.

## Defined in

[fs/opfs\_ext.ts:33](https://github.com/JiangJie/happy-opfs/blob/a6314c4612c605f77895adcb9d6d91abcaafaa7d/src/fs/opfs_ext.ts#L33)
