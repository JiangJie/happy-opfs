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

Defined in: [fs/opfs\_core.ts:98](https://github.com/JiangJie/happy-opfs/blob/dd0edb865892acc2abe55bcb047ccf0f8773705c/src/fs/opfs_core.ts#L98)

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

Defined in: [fs/opfs\_core.ts:109](https://github.com/JiangJie/happy-opfs/blob/dd0edb865892acc2abe55bcb047ccf0f8773705c/src/fs/opfs_core.ts#L109)

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

Defined in: [fs/opfs\_core.ts:120](https://github.com/JiangJie/happy-opfs/blob/dd0edb865892acc2abe55bcb047ccf0f8773705c/src/fs/opfs_core.ts#L120)

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
