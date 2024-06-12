[**happy-opfs**](../README.md) • **Docs**

***

[happy-opfs](../README.md) / readFile

# Function: readFile()

## readFile(filePath, options)

```ts
function readFile(filePath, options): AsyncIOResult<ArrayBuffer>
```

Reads the content of a file at the specified path as an ArrayBuffer.

### Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `filePath` | `string` | The path of the file to read. |
| `options` | [`ReadOptions`](../interfaces/ReadOptions.md) & \{ `encoding`: `"binary"`; \} | Read options specifying the 'binary' encoding. |

### Returns

`AsyncIOResult`\<`ArrayBuffer`\>

A promise that resolves to an `AsyncIOResult` containing the file content as an ArrayBuffer.

### Source

[fs/opfs\_core.ts:45](https://github.com/JiangJie/happy-opfs/blob/fcbf5b5ef2676cbf90b3a855acdadcf7a79ef72c/src/fs/opfs_core.ts#L45)

## readFile(filePath, options)

```ts
function readFile(filePath, options): AsyncIOResult<Blob>
```

Reads the content of a file at the specified path as a Blob.

### Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `filePath` | `string` | The path of the file to read. |
| `options` | [`ReadOptions`](../interfaces/ReadOptions.md) & \{ `encoding`: `"blob"`; \} | Read options specifying the 'blob' encoding. |

### Returns

`AsyncIOResult`\<`Blob`\>

A promise that resolves to an `AsyncIOResult` containing the file content as a Blob.

### Source

[fs/opfs\_core.ts:56](https://github.com/JiangJie/happy-opfs/blob/fcbf5b5ef2676cbf90b3a855acdadcf7a79ef72c/src/fs/opfs_core.ts#L56)

## readFile(filePath, options)

```ts
function readFile(filePath, options): AsyncIOResult<string>
```

Reads the content of a file at the specified path as a string.

### Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `filePath` | `string` | The path of the file to read. |
| `options` | [`ReadOptions`](../interfaces/ReadOptions.md) & \{ `encoding`: `"utf8"`; \} | Read options specifying the 'utf8' encoding. |

### Returns

`AsyncIOResult`\<`string`\>

A promise that resolves to an `AsyncIOResult` containing the file content as a string.

### Source

[fs/opfs\_core.ts:67](https://github.com/JiangJie/happy-opfs/blob/fcbf5b5ef2676cbf90b3a855acdadcf7a79ef72c/src/fs/opfs_core.ts#L67)

## readFile(filePath)

```ts
function readFile(filePath): AsyncIOResult<ArrayBuffer>
```

Reads the content of a file at the specified path as an ArrayBuffer by default.

### Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `filePath` | `string` | The path of the file to read. |

### Returns

`AsyncIOResult`\<`ArrayBuffer`\>

A promise that resolves to an `AsyncIOResult` containing the file content as an ArrayBuffer.

### Source

[fs/opfs\_core.ts:77](https://github.com/JiangJie/happy-opfs/blob/fcbf5b5ef2676cbf90b3a855acdadcf7a79ef72c/src/fs/opfs_core.ts#L77)
