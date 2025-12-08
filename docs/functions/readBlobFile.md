[**happy-opfs**](../README.md)

***

[happy-opfs](../README.md) / readBlobFile

# Function: readBlobFile()

```ts
function readBlobFile(filePath): AsyncIOResult<File>
```

Defined in: [fs/opfs\_ext.ts:290](https://github.com/JiangJie/happy-opfs/blob/dd0edb865892acc2abe55bcb047ccf0f8773705c/src/fs/opfs_ext.ts#L290)

Reads the content of a file as a `File` object (Blob with name).

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `filePath` | `string` | The absolute path of the file to read. |

## Returns

`AsyncIOResult`\<`File`\>

A promise that resolves to an `AsyncIOResult` containing the `File` object.

## Example

```typescript
const result = await readBlobFile('/path/to/file.txt');
if (result.isOk()) {
    const file = result.unwrap();
    console.log(file.name, file.size, file.type);
}
```
