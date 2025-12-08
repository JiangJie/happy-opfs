[**happy-opfs**](../README.md)

***

[happy-opfs](../README.md) / isFileHandleLike

# Function: isFileHandleLike()

```ts
function isFileHandleLike(handle): handle is FileSystemFileHandleLike
```

Defined in: [fs/utils.ts:126](https://github.com/JiangJie/happy-opfs/blob/1ca6e66c9ddde628f35ecf68e910628f2b61ed78/src/fs/utils.ts#L126)

Checks whether the given handle-like object represents a file.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `handle` | [`FileSystemHandleLike`](../interfaces/FileSystemHandleLike.md) | The `FileSystemHandleLike` object to check. |

## Returns

`handle is FileSystemFileHandleLike`

`true` if the handle-like object represents a file, otherwise `false`.

## Example

```typescript
const handleLike = await statSync('/path/to/file').unwrap();
if (isFileHandleLike(handleLike)) {
    console.log(`File size: ${handleLike.size}`);
}
```
