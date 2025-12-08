[**happy-opfs**](../README.md)

***

[happy-opfs](../README.md) / deleteTemp

# Function: deleteTemp()

```ts
function deleteTemp(): AsyncVoidIOResult
```

Defined in: [fs/opfs\_tmp.ts:52](https://github.com/JiangJie/happy-opfs/blob/1ca6e66c9ddde628f35ecf68e910628f2b61ed78/src/fs/opfs_tmp.ts#L52)

Deletes the entire temporary directory (`/tmp`) and all its contents.

## Returns

`AsyncVoidIOResult`

A promise that resolves to an `AsyncVoidIOResult` indicating success or failure.

## Example

```typescript
const result = await deleteTemp();
if (result.isOk()) {
    console.log('Temporary directory deleted');
}
```
