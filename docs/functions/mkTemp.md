[**happy-opfs**](../README.md)

***

[happy-opfs](../README.md) / mkTemp

# Function: mkTemp()

```ts
function mkTemp(options?): AsyncIOResult<string>
```

Defined in: [fs/opfs\_tmp.ts:29](https://github.com/JiangJie/happy-opfs/blob/1ca6e66c9ddde628f35ecf68e910628f2b61ed78/src/fs/opfs_tmp.ts#L29)

Creates a temporary file or directory in the `/tmp` directory.
Uses `crypto.randomUUID()` to generate a unique name.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `options`? | [`TempOptions`](../interfaces/TempOptions.md) | Options for creating the temporary path. |

## Returns

`AsyncIOResult`\<`string`\>

A promise that resolves to an `AsyncIOResult` containing the created path.

## Example

```typescript
// Create a temporary file
const result = await mkTemp();
if (result.isOk()) {
    console.log(result.unwrap()); // '/tmp/tmp-550e8400-e29b-41d4-a716-446655440000'
}

// Create a temporary directory
const dirResult = await mkTemp({ isDirectory: true });

// Create with custom basename and extension
const customResult = await mkTemp({ basename: 'cache', extname: '.json' });
```
