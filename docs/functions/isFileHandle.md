[**happy-opfs**](../README.md)

***

[happy-opfs](../README.md) / isFileHandle

# Function: isFileHandle()

```ts
function isFileHandle(handle): handle is FileSystemFileHandle
```

Defined in: [fs/utils.ts:92](https://github.com/JiangJie/happy-opfs/blob/1ca6e66c9ddde628f35ecf68e910628f2b61ed78/src/fs/utils.ts#L92)

Checks whether the given handle is a file handle.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `handle` | `FileSystemHandle` | The `FileSystemHandle` to check. |

## Returns

`handle is FileSystemFileHandle`

`true` if the handle is a `FileSystemFileHandle`, otherwise `false`.

## Example

```typescript
const handle = await stat('/path/to/file');
if (handle.isOk() && isFileHandle(handle.unwrap())) {
    console.log('This is a file');
}
```
