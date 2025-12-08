[**happy-opfs**](../README.md)

***

[happy-opfs](../README.md) / readFile

# Function: readFile()

Reads the content of a file at the specified path with the specified options.

## Template

The type of the content to read from the file.

## Param

The path of the file to read.

## Param

Optional read options.

## Call Signature

```ts
function readFile(filePath, options): AsyncIOResult<File>
```

Defined in: [fs/opfs\_core.ts:97](https://github.com/JiangJie/happy-opfs/blob/1ca6e66c9ddde628f35ecf68e910628f2b61ed78/src/fs/opfs_core.ts#L97)

Reads the content of a file at the specified path as a File.

### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `filePath` | `string` | The path of the file to read. |
| `options` | [`ReadOptions`](../interfaces/ReadOptions.md) & \{ `encoding`: `"blob"`; \} | Read options specifying the 'blob' encoding. |

### Returns

`AsyncIOResult`\<`File`\>

A promise that resolves to an `AsyncIOResult` containing the file content.

A promise that resolves to an `AsyncIOResult` containing the file content as a File.

### Template

The type of the content to read from the file.

### Param

The path of the file to read.

### Param

Optional read options.

## Call Signature

```ts
function readFile(filePath, options): AsyncIOResult<string>
```

Defined in: [fs/opfs\_core.ts:108](https://github.com/JiangJie/happy-opfs/blob/1ca6e66c9ddde628f35ecf68e910628f2b61ed78/src/fs/opfs_core.ts#L108)

Reads the content of a file at the specified path as a string.

### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `filePath` | `string` | The path of the file to read. |
| `options` | [`ReadOptions`](../interfaces/ReadOptions.md) & \{ `encoding`: `"utf8"`; \} | Read options specifying the 'utf8' encoding. |

### Returns

`AsyncIOResult`\<`string`\>

A promise that resolves to an `AsyncIOResult` containing the file content.

A promise that resolves to an `AsyncIOResult` containing the file content as a string.

### Template

The type of the content to read from the file.

### Param

The path of the file to read.

### Param

Optional read options.

## Call Signature

```ts
function readFile(filePath, options?): AsyncIOResult<ArrayBuffer>
```

Defined in: [fs/opfs\_core.ts:119](https://github.com/JiangJie/happy-opfs/blob/1ca6e66c9ddde628f35ecf68e910628f2b61ed78/src/fs/opfs_core.ts#L119)

Reads the content of a file at the specified path as an ArrayBuffer by default.

### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `filePath` | `string` | The path of the file to read. |
| `options`? | [`ReadOptions`](../interfaces/ReadOptions.md) & \{ `encoding`: `"binary"`; \} | Read options specifying the 'binary' encoding. |

### Returns

`AsyncIOResult`\<`ArrayBuffer`\>

A promise that resolves to an `AsyncIOResult` containing the file content.

A promise that resolves to an `AsyncIOResult` containing the file content as an ArrayBuffer.

### Template

The type of the content to read from the file.

### Param

The path of the file to read.

### Param

Optional read options.
