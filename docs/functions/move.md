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

Defined in: [fs/opfs\_ext.ts:246](https://github.com/JiangJie/happy-opfs/blob/1ca6e66c9ddde628f35ecf68e910628f2b61ed78/src/fs/opfs_ext.ts#L246)

Moves a file or directory from one location to another.
Both source and destination must be of the same type (both files or both directories).

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `srcPath` | `string` | The absolute source path. |
| `destPath` | `string` | The absolute destination path. |
| `options`? | [`MoveOptions`](../interfaces/MoveOptions.md) | Optional move options. |

## Returns

`AsyncVoidIOResult`

A promise that resolves to an `AsyncVoidIOResult` indicating success or failure.

## Example

```typescript
// Move/rename a file
await move('/old/path/file.txt', '/new/path/file.txt');

// Move a directory
await move('/old/folder', '/new/folder');
```
