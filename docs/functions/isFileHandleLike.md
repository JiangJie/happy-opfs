[**happy-opfs**](../README.md)

***

[happy-opfs](../README.md) / isFileHandleLike

# Function: isFileHandleLike()

```ts
function isFileHandleLike(handle): handle is FileSystemFileHandleLike
```

Defined in: [fs/utils.ts:126](https://github.com/JiangJie/happy-opfs/blob/dd0edb865892acc2abe55bcb047ccf0f8773705c/src/fs/utils.ts#L126)

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
