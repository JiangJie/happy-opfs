[**happy-opfs**](../README.md)

***

[happy-opfs](../README.md) / readBlobFile

# Function: readBlobFile()

```ts
function readBlobFile(filePath): AsyncIOResult<File>
```

Defined in: [fs/opfs\_ext.ts:271](https://github.com/JiangJie/happy-opfs/blob/1ca6e66c9ddde628f35ecf68e910628f2b61ed78/src/fs/opfs_ext.ts#L271)

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
