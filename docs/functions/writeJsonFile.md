[**happy-opfs**](../README.md)

***

[happy-opfs](../README.md) / writeJsonFile

# Function: writeJsonFile()

```ts
function writeJsonFile<T>(filePath, data): AsyncVoidIOResult
```

Defined in: [fs/opfs\_ext.ts:340](https://github.com/JiangJie/happy-opfs/blob/1ca6e66c9ddde628f35ecf68e910628f2b61ed78/src/fs/opfs_ext.ts#L340)

Writes an object to a file as JSON.

## Type Parameters

| Type Parameter | Description |
| ------ | ------ |
| `T` | The type of the object to write. |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `filePath` | `string` | The absolute path of the file to write. |
| `data` | `T` | The object to serialize and write. |

## Returns

`AsyncVoidIOResult`

A promise that resolves to an `AsyncVoidIOResult` indicating success or failure.

## Example

```typescript
const config = { name: 'app', version: 1 };
const result = await writeJsonFile('/config.json', config);
if (result.isOk()) {
    console.log('Config saved');
}
```
