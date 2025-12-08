[**happy-opfs**](../README.md)

***

[happy-opfs](../README.md) / isDirectoryHandle

# Function: isDirectoryHandle()

```ts
function isDirectoryHandle(handle): handle is FileSystemDirectoryHandle
```

Defined in: [fs/utils.ts:109](https://github.com/JiangJie/happy-opfs/blob/1ca6e66c9ddde628f35ecf68e910628f2b61ed78/src/fs/utils.ts#L109)

Checks whether the given handle is a directory handle.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `handle` | `FileSystemHandle` | The `FileSystemHandle` to check. |

## Returns

`handle is FileSystemDirectoryHandle`

`true` if the handle is a `FileSystemDirectoryHandle`, otherwise `false`.

## Example

```typescript
const handle = await stat('/path/to/dir');
if (handle.isOk() && isDirectoryHandle(handle.unwrap())) {
    console.log('This is a directory');
}
```
