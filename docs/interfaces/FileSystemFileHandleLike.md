[**happy-opfs**](../README.md)

***

[happy-opfs](../README.md) / FileSystemFileHandleLike

# Interface: FileSystemFileHandleLike

Defined in: [fs/defines.ts:158](https://github.com/JiangJie/happy-opfs/blob/1ca6e66c9ddde628f35ecf68e910628f2b61ed78/src/fs/defines.ts#L158)

A serializable representation of a file handle with additional metadata.
Extends `FileSystemHandleLike` with file-specific properties.

## Extends

- [`FileSystemHandleLike`](FileSystemHandleLike.md)

## Properties

| Property | Type | Description | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="kind"></a> `kind` | `FileSystemHandleKind` | The kind of the entry: `'file'` or `'directory'`. | [`FileSystemHandleLike`](FileSystemHandleLike.md).[`kind`](FileSystemHandleLike.md#kind) | [fs/defines.ts:151](https://github.com/JiangJie/happy-opfs/blob/1ca6e66c9ddde628f35ecf68e910628f2b61ed78/src/fs/defines.ts#L151) |
| <a id="lastmodified"></a> `lastModified` | `number` | The last modified timestamp in milliseconds since Unix epoch. | - | [fs/defines.ts:172](https://github.com/JiangJie/happy-opfs/blob/1ca6e66c9ddde628f35ecf68e910628f2b61ed78/src/fs/defines.ts#L172) |
| <a id="name"></a> `name` | `string` | The name of the file or directory. | [`FileSystemHandleLike`](FileSystemHandleLike.md).[`name`](FileSystemHandleLike.md#name) | [fs/defines.ts:146](https://github.com/JiangJie/happy-opfs/blob/1ca6e66c9ddde628f35ecf68e910628f2b61ed78/src/fs/defines.ts#L146) |
| <a id="size"></a> `size` | `number` | The size of the file in bytes. | - | [fs/defines.ts:167](https://github.com/JiangJie/happy-opfs/blob/1ca6e66c9ddde628f35ecf68e910628f2b61ed78/src/fs/defines.ts#L167) |
| <a id="type"></a> `type` | `string` | The MIME type of the file (e.g., `'text/plain'`, `'image/png'`). | - | [fs/defines.ts:162](https://github.com/JiangJie/happy-opfs/blob/1ca6e66c9ddde628f35ecf68e910628f2b61ed78/src/fs/defines.ts#L162) |
