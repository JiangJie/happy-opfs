[**happy-opfs**](../README.md)

***

[happy-opfs](../README.md) / mkdir

# Function: mkdir()

```ts
function mkdir(dirPath): AsyncVoidIOResult
```

Defined in: [fs/opfs\_core.ts:48](https://github.com/JiangJie/happy-opfs/blob/1ca6e66c9ddde628f35ecf68e910628f2b61ed78/src/fs/opfs_core.ts#L48)

Creates a new directory at the specified path, similar to `mkdir -p`.
Creates all necessary parent directories if they don't exist.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `dirPath` | `string` | The absolute path where the directory will be created. |

## Returns

`AsyncVoidIOResult`

A promise that resolves to an `AsyncVoidIOResult` indicating success or failure.

## Example

```typescript
const result = await mkdir('/path/to/new/directory');
if (result.isOk()) {
    console.log('Directory created successfully');
}
```
