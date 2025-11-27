[**happy-opfs**](../README.md)

***

[happy-opfs](../README.md) / copy

# Function: copy()

```ts
function copy(
   srcPath, 
   destPath, 
   options?): AsyncVoidIOResult
```

Defined in: [fs/opfs\_ext.ts:136](https://github.com/JiangJie/happy-opfs/blob/318f46cfcd998ebd962bc0e9335ea2aaef290cf7/src/fs/opfs_ext.ts#L136)

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
