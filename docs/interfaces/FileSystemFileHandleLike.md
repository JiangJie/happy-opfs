[**happy-opfs**](../README.md) • **Docs**

***

[happy-opfs](../README.md) / FileSystemFileHandleLike

# Interface: FileSystemFileHandleLike

A handle to a file or directory returned by `statSync`.

## Extends

- [`FileSystemHandleLike`](FileSystemHandleLike.md)

## Properties

| Property | Type | Description | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| `kind` | `FileSystemHandleKind` | The kind of the entry. | [`FileSystemHandleLike`](FileSystemHandleLike.md).`kind` | [fs/defines.ts:133](https://github.com/JiangJie/happy-opfs/blob/948cb3ee1ba6a4ce667d07bda817012e57b50bb8/src/fs/defines.ts#L133) |
| `lastModified` | `number` | The last modified time of the file. | - | [fs/defines.ts:150](https://github.com/JiangJie/happy-opfs/blob/948cb3ee1ba6a4ce667d07bda817012e57b50bb8/src/fs/defines.ts#L150) |
| `name` | `string` | The name of the entry. | [`FileSystemHandleLike`](FileSystemHandleLike.md).`name` | [fs/defines.ts:128](https://github.com/JiangJie/happy-opfs/blob/948cb3ee1ba6a4ce667d07bda817012e57b50bb8/src/fs/defines.ts#L128) |
| `size` | `number` | The size of the file. | - | [fs/defines.ts:145](https://github.com/JiangJie/happy-opfs/blob/948cb3ee1ba6a4ce667d07bda817012e57b50bb8/src/fs/defines.ts#L145) |
| `type` | `string` | The type of the file. | - | [fs/defines.ts:140](https://github.com/JiangJie/happy-opfs/blob/948cb3ee1ba6a4ce667d07bda817012e57b50bb8/src/fs/defines.ts#L140) |
