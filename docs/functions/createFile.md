[**happy-opfs**](../README.md)

***

[happy-opfs](../README.md) / createFile

# Function: createFile()

```ts
function createFile(filePath): AsyncVoidIOResult
```

Defined in: [fs/opfs\_core.ts:25](https://github.com/JiangJie/happy-opfs/blob/dd0edb865892acc2abe55bcb047ccf0f8773705c/src/fs/opfs_core.ts#L25)

Creates a new empty file at the specified path, similar to the `touch` command.
If the file already exists, this operation succeeds without modifying it.
Parent directories are created automatically if they don't exist.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `filePath` | `string` | The absolute path of the file to create. |

## Returns

`AsyncVoidIOResult`

A promise that resolves to an `AsyncVoidIOResult` indicating success or failure.

## Example

```typescript
const result = await createFile('/path/to/file.txt');
if (result.isOk()) {
    console.log('File created successfully');
}
```
