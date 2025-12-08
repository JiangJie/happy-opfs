[**happy-opfs**](../README.md)

***

[happy-opfs](../README.md) / readFileSync

# Function: readFileSync()

Synchronous version of `readFile`.
Reads the content of a file with the specified encoding.

## Template

The expected content type based on encoding.

## Param

The absolute path of the file to read.

## Param

Optional read options.

## See

[readFile](readFile.md) for the async version.

## Call Signature

```ts
function readFileSync(filePath, options): IOResult<FileLike>
```

Defined in: [worker/opfs\_worker\_adapter.ts:247](https://github.com/JiangJie/happy-opfs/blob/dd0edb865892acc2abe55bcb047ccf0f8773705c/src/worker/opfs_worker_adapter.ts#L247)

Synchronous version of `readFile`.
Reads the content of a file as a `FileLike` object (blob encoding).

### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `filePath` | `string` | The absolute path of the file to read. |
| `options` | [`ReadOptions`](../interfaces/ReadOptions.md) & \{ `encoding`: `"blob"`; \} | Read options with 'blob' encoding. |

### Returns

`IOResult`\<[`FileLike`](../interfaces/FileLike.md)\>

An `IOResult` containing the file content.

An `IOResult` containing a `FileLike` object.

### Template

The expected content type based on encoding.

### Param

The absolute path of the file to read.

### Param

Optional read options.

### See

[readFile](readFile.md) for the async version.

## Call Signature

```ts
function readFileSync(filePath, options): IOResult<string>
```

Defined in: [worker/opfs\_worker\_adapter.ts:258](https://github.com/JiangJie/happy-opfs/blob/dd0edb865892acc2abe55bcb047ccf0f8773705c/src/worker/opfs_worker_adapter.ts#L258)

Synchronous version of `readFile`.
Reads the content of a file as a string (utf8 encoding).

### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `filePath` | `string` | The absolute path of the file to read. |
| `options` | [`ReadOptions`](../interfaces/ReadOptions.md) & \{ `encoding`: `"utf8"`; \} | Read options with 'utf8' encoding. |

### Returns

`IOResult`\<`string`\>

An `IOResult` containing the file content.

An `IOResult` containing the file content as a string.

### Template

The expected content type based on encoding.

### Param

The absolute path of the file to read.

### Param

Optional read options.

### See

[readFile](readFile.md) for the async version.

## Call Signature

```ts
function readFileSync(filePath, options?): IOResult<ArrayBuffer>
```

Defined in: [worker/opfs\_worker\_adapter.ts:269](https://github.com/JiangJie/happy-opfs/blob/dd0edb865892acc2abe55bcb047ccf0f8773705c/src/worker/opfs_worker_adapter.ts#L269)

Synchronous version of `readFile`.
Reads the content of a file as an ArrayBuffer (binary/default encoding).

### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `filePath` | `string` | The absolute path of the file to read. |
| `options`? | [`ReadOptions`](../interfaces/ReadOptions.md) & \{ `encoding`: `"binary"`; \} | Optional read options with 'binary' encoding. |

### Returns

`IOResult`\<`ArrayBuffer`\>

An `IOResult` containing the file content.

An `IOResult` containing the file content as an ArrayBuffer.

### Template

The expected content type based on encoding.

### Param

The absolute path of the file to read.

### Param

Optional read options.

### See

[readFile](readFile.md) for the async version.
