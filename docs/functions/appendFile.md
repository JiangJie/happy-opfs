[**happy-opfs**](../README.md)

***

[happy-opfs](../README.md) / appendFile

# Function: appendFile()

```ts
function appendFile(filePath, contents): AsyncVoidIOResult
```

Defined in: [fs/opfs\_ext.ts:144](https://github.com/JiangJie/happy-opfs/blob/dd0edb865892acc2abe55bcb047ccf0f8773705c/src/fs/opfs_ext.ts#L144)

Appends content to a file at the specified path.
Creates the file if it doesn't exist.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `filePath` | `string` | The absolute path of the file to append to. |
| `contents` | [`WriteFileContent`](../type-aliases/WriteFileContent.md) | The content to append (string, ArrayBuffer, TypedArray, or Blob). |

## Returns

`AsyncVoidIOResult`

A promise that resolves to an `AsyncVoidIOResult` indicating success or failure.

## Example

```typescript
await appendFile('/path/to/log.txt', 'New log entry\n');
```
