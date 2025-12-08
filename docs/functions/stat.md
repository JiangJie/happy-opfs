[**happy-opfs**](../README.md)

***

[happy-opfs](../README.md) / stat

# Function: stat()

```ts
function stat(path): AsyncIOResult<FileSystemHandle>
```

Defined in: [fs/opfs\_core.ts:217](https://github.com/JiangJie/happy-opfs/blob/dd0edb865892acc2abe55bcb047ccf0f8773705c/src/fs/opfs_core.ts#L217)

Retrieves the `FileSystemHandle` for a file or directory at the specified path.
Can be used to check the type (file or directory) and access metadata.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `path` | `string` | The absolute path of the file or directory. |

## Returns

`AsyncIOResult`\<`FileSystemHandle`\>

A promise that resolves to an `AsyncIOResult` containing the `FileSystemHandle`.

## Example

```typescript
const result = await stat('/path/to/entry');
if (result.isOk()) {
    const handle = result.unwrap();
    console.log(`Kind: ${handle.kind}, Name: ${handle.name}`);
}
```
