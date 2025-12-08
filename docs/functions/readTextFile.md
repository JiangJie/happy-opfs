[**happy-opfs**](../README.md)

***

[happy-opfs](../README.md) / readTextFile

# Function: readTextFile()

```ts
function readTextFile(filePath): AsyncIOResult<string>
```

Defined in: [fs/opfs\_ext.ts:337](https://github.com/JiangJie/happy-opfs/blob/dd0edb865892acc2abe55bcb047ccf0f8773705c/src/fs/opfs_ext.ts#L337)

Reads a file as a UTF-8 string.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `filePath` | `string` | The absolute path of the file to read. |

## Returns

`AsyncIOResult`\<`string`\>

A promise that resolves to an `AsyncIOResult` containing the file content as a string.

## Example

```typescript
const result = await readTextFile('/path/to/file.txt');
if (result.isOk()) {
    console.log(result.unwrap());
}
```
