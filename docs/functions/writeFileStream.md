[**happy-opfs**](../README.md)

***

[happy-opfs](../README.md) / writeFileStream

# Function: writeFileStream()

```ts
function writeFileStream(filePath, options?): AsyncIOResult<FileSystemWritableFileStream>
```

Defined in: [fs/opfs\_core.ts:403](https://github.com/JiangJie/happy-opfs/blob/1ca6e66c9ddde628f35ecf68e910628f2b61ed78/src/fs/opfs_core.ts#L403)

Opens a file and returns a writable stream for writing contents.
Useful for writing large files without loading them entirely into memory.
The caller is responsible for closing the stream when done.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `filePath` | `string` | The absolute path of the file to write. |
| `options`? | [`WriteOptions`](../interfaces/WriteOptions.md) | Optional write options. |

## Returns

`AsyncIOResult`\<`FileSystemWritableFileStream`\>

A promise that resolves to an `AsyncIOResult` containing a `FileSystemWritableFileStream`.

## Example

```typescript
const result = await writeFileStream('/path/to/large-file.bin');
if (result.isOk()) {
    const stream = result.unwrap();
    try {
        await stream.write(new Uint8Array([1, 2, 3]));
        await stream.write(new Uint8Array([4, 5, 6]));
    } finally {
        await stream.close();
    }
}
```
