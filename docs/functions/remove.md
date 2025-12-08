[**happy-opfs**](../README.md)

***

[happy-opfs](../README.md) / remove

# Function: remove()

```ts
function remove(path): AsyncVoidIOResult
```

Defined in: [fs/opfs\_core.ts:168](https://github.com/JiangJie/happy-opfs/blob/1ca6e66c9ddde628f35ecf68e910628f2b61ed78/src/fs/opfs_core.ts#L168)

Removes a file or directory at the specified path, similar to `rm -rf`.
If the path doesn't exist, the operation succeeds silently.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `path` | `string` | The absolute path of the file or directory to remove. |

## Returns

`AsyncVoidIOResult`

A promise that resolves to an `AsyncVoidIOResult` indicating success or failure.

## Example

```typescript
const result = await remove('/path/to/file-or-directory');
if (result.isOk()) {
    console.log('Removed successfully');
}
```
