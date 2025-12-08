[**happy-opfs**](../README.md)

***

[happy-opfs](../README.md) / generateTempPath

# Function: generateTempPath()

```ts
function generateTempPath(options?): string
```

Defined in: [fs/utils.ts:19](https://github.com/JiangJie/happy-opfs/blob/1ca6e66c9ddde628f35ecf68e910628f2b61ed78/src/fs/utils.ts#L19)

Generates a unique temporary file or directory path without creating it.
Uses `crypto.randomUUID()` to ensure uniqueness.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `options`? | [`TempOptions`](../interfaces/TempOptions.md) | Options for generating the temporary path. |

## Returns

`string`

The generated temporary path string.

## Example

```typescript
generateTempPath();                           // '/tmp/tmp-550e8400-e29b-41d4-a716-446655440000'
generateTempPath({ basename: 'cache' });      // '/tmp/cache-550e8400-e29b-41d4-a716-446655440000'
generateTempPath({ extname: '.txt' });        // '/tmp/tmp-550e8400-e29b-41d4-a716-446655440000.txt'
generateTempPath({ isDirectory: true });      // '/tmp/tmp-550e8400-e29b-41d4-a716-446655440000'
```
