[**happy-opfs**](../README.md)

***

[happy-opfs](../README.md) / ReadDirEntry

# Interface: ReadDirEntry

Defined in: [fs/defines.ts:106](https://github.com/JiangJie/happy-opfs/blob/dd0edb865892acc2abe55bcb047ccf0f8773705c/src/fs/defines.ts#L106)

An entry returned by `readDir`.

## Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="handle"></a> `handle` | `FileSystemHandle` | The `FileSystemHandle` of the entry. Use `isFileHandle()` or `isDirectoryHandle()` to determine the type. | [fs/defines.ts:118](https://github.com/JiangJie/happy-opfs/blob/dd0edb865892acc2abe55bcb047ccf0f8773705c/src/fs/defines.ts#L118) |
| <a id="path"></a> `path` | `string` | The relative path of the entry from the `readDir` path parameter. For non-recursive reads, this is just the entry name. For recursive reads, this includes the subdirectory path. | [fs/defines.ts:112](https://github.com/JiangJie/happy-opfs/blob/dd0edb865892acc2abe55bcb047ccf0f8773705c/src/fs/defines.ts#L112) |
