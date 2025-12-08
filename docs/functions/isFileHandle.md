[**happy-opfs**](../README.md)

***

[happy-opfs](../README.md) / isFileHandle

# Function: isFileHandle()

```ts
function isFileHandle(handle): handle is FileSystemFileHandle
```

Defined in: [fs/utils.ts:92](https://github.com/JiangJie/happy-opfs/blob/dd0edb865892acc2abe55bcb047ccf0f8773705c/src/fs/utils.ts#L92)

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
