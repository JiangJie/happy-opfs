[**happy-opfs**](../README.md)

***

[happy-opfs](../README.md) / writeFile

# Function: writeFile()

```ts
function writeFile(
   filePath, 
   contents, 
   options?): AsyncVoidIOResult
```

Defined in: [fs/opfs\_core.ts:273](https://github.com/JiangJie/happy-opfs/blob/dd0edb865892acc2abe55bcb047ccf0f8773705c/src/fs/opfs_core.ts#L273)

Writes content to a file at the specified path.
Creates the file and parent directories if they don't exist (unless `create: false`).

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `filePath` | `string` | The absolute path of the file to write to. |
| `contents` | [`WriteFileContent`](../type-aliases/WriteFileContent.md) | The content to write (string, ArrayBuffer, TypedArray, or Blob). |
| `options`? | [`WriteOptions`](../interfaces/WriteOptions.md) | Optional write options. |

## Returns

`AsyncVoidIOResult`

A promise that resolves to an `AsyncVoidIOResult` indicating success or failure.

## Example

```typescript
// Write string content
await writeFile('/path/to/file.txt', 'Hello, World!');

// Write binary content
await writeFile('/path/to/file.bin', new Uint8Array([1, 2, 3]));

// Append to existing file
await writeFile('/path/to/file.txt', '\nMore content', { append: true });
```
