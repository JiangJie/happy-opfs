[**happy-opfs**](../README.md)

***

[happy-opfs](../README.md) / remove

# Function: remove()

```ts
function remove(path): AsyncVoidIOResult
```

Defined in: [fs/opfs\_core.ts:169](https://github.com/JiangJie/happy-opfs/blob/dd0edb865892acc2abe55bcb047ccf0f8773705c/src/fs/opfs_core.ts#L169)

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
