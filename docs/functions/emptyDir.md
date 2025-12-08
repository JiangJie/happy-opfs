[**happy-opfs**](../README.md)

***

[happy-opfs](../README.md) / emptyDir

# Function: emptyDir()

```ts
function emptyDir(dirPath): AsyncVoidIOResult
```

Defined in: [fs/opfs\_ext.ts:173](https://github.com/JiangJie/happy-opfs/blob/1ca6e66c9ddde628f35ecf68e910628f2b61ed78/src/fs/opfs_ext.ts#L173)

Empties all contents of a directory at the specified path.
If the directory doesn't exist, it will be created.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `dirPath` | `string` | The absolute path of the directory to empty. |

## Returns

`AsyncVoidIOResult`

A promise that resolves to an `AsyncVoidIOResult` indicating success or failure.

## Example

```typescript
await emptyDir('/path/to/directory');
```
