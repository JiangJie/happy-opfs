[**happy-opfs**](../README.md) • **Docs**

***

[happy-opfs](../README.md) / FileSystemHandleLike

# Interface: FileSystemHandleLike

A handle to a file or directory returned by `statSync`.

## Extended by

- [`FileSystemFileHandleLike`](FileSystemFileHandleLike.md)

## Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| `kind` | `FileSystemHandleKind` | The kind of the entry. | [fs/defines.ts:133](https://github.com/JiangJie/happy-opfs/blob/584e221ed8f9c25f1e723b7898a60bc25fe8652b/src/fs/defines.ts#L133) |
| `name` | `string` | The name of the entry. | [fs/defines.ts:128](https://github.com/JiangJie/happy-opfs/blob/584e221ed8f9c25f1e723b7898a60bc25fe8652b/src/fs/defines.ts#L128) |
