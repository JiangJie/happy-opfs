[**happy-opfs**](../README.md) • **Docs**

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

## readFile(filePath, options)

```ts
function readFile(filePath, options): AsyncIOResult<Blob>
```

Reads the content of a file at the specified path as a Blob.

### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `filePath` | `string` | The path of the file to read. |
| `options` | [`ReadOptions`](../interfaces/ReadOptions.md) & \{ `encoding`: `"blob"`; \} | Read options specifying the 'blob' encoding. |

### Returns

`AsyncIOResult`\<`Blob`\>

A promise that resolves to an `AsyncIOResult` containing the file content.

A promise that resolves to an `AsyncIOResult` containing the file content as a Blob.

### Template

The type of the content to read from the file.

### Param

The path of the file to read.

### Param

Optional read options.

### Defined in

[fs/opfs\_core.ts:63](https://github.com/JiangJie/happy-opfs/blob/584e221ed8f9c25f1e723b7898a60bc25fe8652b/src/fs/opfs_core.ts#L63)

## readFile(filePath, options)

```ts
function readFile(filePath, options): AsyncIOResult<string>
```

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

### Defined in

[fs/opfs\_core.ts:74](https://github.com/JiangJie/happy-opfs/blob/584e221ed8f9c25f1e723b7898a60bc25fe8652b/src/fs/opfs_core.ts#L74)

## readFile(filePath, options)

```ts
function readFile(filePath, options?): AsyncIOResult<ArrayBuffer>
```

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

### Defined in

[fs/opfs\_core.ts:85](https://github.com/JiangJie/happy-opfs/blob/584e221ed8f9c25f1e723b7898a60bc25fe8652b/src/fs/opfs_core.ts#L85)
