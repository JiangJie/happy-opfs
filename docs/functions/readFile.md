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

[fs/opfs\_core.ts:66](https://github.com/JiangJie/happy-opfs/blob/3f62bbf8fdd56458cded8789b78dded5dd27b670/src/fs/opfs_core.ts#L66)

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

[fs/opfs\_core.ts:77](https://github.com/JiangJie/happy-opfs/blob/3f62bbf8fdd56458cded8789b78dded5dd27b670/src/fs/opfs_core.ts#L77)

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

[fs/opfs\_core.ts:88](https://github.com/JiangJie/happy-opfs/blob/3f62bbf8fdd56458cded8789b78dded5dd27b670/src/fs/opfs_core.ts#L88)
