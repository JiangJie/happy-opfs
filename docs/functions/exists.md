[**happy-opfs**](../README.md)

***

[happy-opfs](../README.md) / exists

# Function: exists()

```ts
function exists(path, options?): AsyncIOResult<boolean>
```

Defined in: [fs/opfs\_ext.ts:210](https://github.com/JiangJie/happy-opfs/blob/1ca6e66c9ddde628f35ecf68e910628f2b61ed78/src/fs/opfs_ext.ts#L210)

Checks whether a file or directory exists at the specified path.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `path` | `string` | The absolute path to check. |
| `options`? | [`ExistsOptions`](../interfaces/ExistsOptions.md) | Optional existence options. |

## Returns

`AsyncIOResult`\<`boolean`\>

A promise that resolves to an `AsyncIOResult<boolean>` indicating existence.

## Example

```typescript
// Check if path exists (file or directory)
const exists = await exists('/path/to/entry');

// Check if path exists and is a file
const isFile = await exists('/path/to/file', { isFile: true });

// Check if path exists and is a directory
const isDir = await exists('/path/to/dir', { isDirectory: true });
```
