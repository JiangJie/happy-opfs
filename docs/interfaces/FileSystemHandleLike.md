[**happy-opfs**](../README.md)

***

[happy-opfs](../README.md) / FileSystemHandleLike

# Interface: FileSystemHandleLike

Defined in: [fs/defines.ts:142](https://github.com/JiangJie/happy-opfs/blob/dd0edb865892acc2abe55bcb047ccf0f8773705c/src/fs/defines.ts#L142)

A serializable representation of a file or directory handle.
Returned by `statSync` and used in `ReadDirEntrySync`.

## Extended by

- [`FileSystemFileHandleLike`](FileSystemFileHandleLike.md)

## Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="kind"></a> `kind` | `FileSystemHandleKind` | The kind of the entry: `'file'` or `'directory'`. | [fs/defines.ts:151](https://github.com/JiangJie/happy-opfs/blob/dd0edb865892acc2abe55bcb047ccf0f8773705c/src/fs/defines.ts#L151) |
| <a id="name"></a> `name` | `string` | The name of the file or directory. | [fs/defines.ts:146](https://github.com/JiangJie/happy-opfs/blob/dd0edb865892acc2abe55bcb047ccf0f8773705c/src/fs/defines.ts#L146) |
