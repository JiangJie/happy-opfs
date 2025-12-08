[**happy-opfs**](../README.md)

***

[happy-opfs](../README.md) / readJsonFile

# Function: readJsonFile()

```ts
function readJsonFile<T>(filePath): AsyncIOResult<T>
```

Defined in: [fs/opfs\_ext.ts:314](https://github.com/JiangJie/happy-opfs/blob/dd0edb865892acc2abe55bcb047ccf0f8773705c/src/fs/opfs_ext.ts#L314)

Reads a JSON file and parses its content.

## Type Parameters

| Type Parameter | Description |
| ------ | ------ |
| `T` | The expected type of the parsed JSON object. |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `filePath` | `string` | The path of the JSON file to read. |

## Returns

`AsyncIOResult`\<`T`\>

A promise that resolves to an `AsyncIOResult` containing the parsed JSON object.

## Example

```typescript
interface Config {
    name: string;
    version: number;
}
const result = await readJsonFile<Config>('/config.json');
if (result.isOk()) {
    console.log(result.unwrap().name);
}
```
