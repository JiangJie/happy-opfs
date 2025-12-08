[**happy-opfs**](../README.md)

***

[happy-opfs](../README.md) / isTempPath

# Function: isTempPath()

```ts
function isTempPath(path): boolean
```

Defined in: [fs/utils.ts:44](https://github.com/JiangJie/happy-opfs/blob/dd0edb865892acc2abe55bcb047ccf0f8773705c/src/fs/utils.ts#L44)

Checks whether the path is a temporary path (under `/tmp`).

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `path` | `string` | The path to check. |

## Returns

`boolean`

`true` if the path starts with `/tmp/`, otherwise `false`.

## Example

```typescript
isTempPath('/tmp/file.txt');  // true
isTempPath('/data/file.txt'); // false
```
