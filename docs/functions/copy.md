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

Defined in: [fs/opfs\_ext.ts:152](https://github.com/JiangJie/happy-opfs/blob/1ca6e66c9ddde628f35ecf68e910628f2b61ed78/src/fs/opfs_ext.ts#L152)

Copies a file or directory from one location to another, similar to `cp -r`.
Both source and destination must be of the same type (both files or both directories).

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `srcPath` | `string` | The absolute source path. |
| `destPath` | `string` | The absolute destination path. |
| `options`? | [`CopyOptions`](../interfaces/CopyOptions.md) | Optional copy options. |

## Returns

`AsyncVoidIOResult`

A promise that resolves to an `AsyncVoidIOResult` indicating success or failure.

## Example

```typescript
// Copy a file
await copy('/src/file.txt', '/dest/file.txt');

// Copy a directory
await copy('/src/folder', '/dest/folder');

// Copy without overwriting existing files
await copy('/src', '/dest', { overwrite: false });
```
