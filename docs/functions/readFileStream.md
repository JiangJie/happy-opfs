[**happy-opfs**](../README.md)

***

[happy-opfs](../README.md) / readFileStream

# Function: readFileStream()

```ts
function readFileStream(filePath): AsyncIOResult<ReadableStream<Uint8Array<ArrayBuffer>>>
```

Defined in: [fs/opfs\_core.ts:370](https://github.com/JiangJie/happy-opfs/blob/1ca6e66c9ddde628f35ecf68e910628f2b61ed78/src/fs/opfs_core.ts#L370)

Opens a file and returns a readable stream for reading its contents.
Useful for processing large files without loading them entirely into memory.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `filePath` | `string` | The absolute path of the file to read. |

## Returns

`AsyncIOResult`\<`ReadableStream`\<`Uint8Array`\<`ArrayBuffer`\>\>\>

A promise that resolves to an `AsyncIOResult` containing a `ReadableStream<Uint8Array>`.

## Example

```typescript
const result = await readFileStream('/path/to/large-file.bin');
if (result.isOk()) {
    const stream = result.unwrap();
    const reader = stream.getReader();
    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        // Process chunk
        console.log('Received chunk:', value.length, 'bytes');
    }
}
```
