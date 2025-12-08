[**happy-opfs**](../README.md)

***

[happy-opfs](../README.md) / stat

# Function: stat()

```ts
function stat(path): AsyncIOResult<FileSystemHandle>
```

Defined in: [fs/opfs\_core.ts:216](https://github.com/JiangJie/happy-opfs/blob/1ca6e66c9ddde628f35ecf68e910628f2b61ed78/src/fs/opfs_core.ts#L216)

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
