[**happy-opfs**](../README.md)

***

[happy-opfs](../README.md) / ReadDirEntry

# Interface: ReadDirEntry

Defined in: [fs/defines.ts:106](https://github.com/JiangJie/happy-opfs/blob/1ca6e66c9ddde628f35ecf68e910628f2b61ed78/src/fs/defines.ts#L106)

An entry returned by `readDir`.

## Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="handle"></a> `handle` | `FileSystemHandle` | The `FileSystemHandle` of the entry. Use `isFileHandle()` or `isDirectoryHandle()` to determine the type. | [fs/defines.ts:118](https://github.com/JiangJie/happy-opfs/blob/1ca6e66c9ddde628f35ecf68e910628f2b61ed78/src/fs/defines.ts#L118) |
| <a id="path"></a> `path` | `string` | The relative path of the entry from the `readDir` path parameter. For non-recursive reads, this is just the entry name. For recursive reads, this includes the subdirectory path. | [fs/defines.ts:112](https://github.com/JiangJie/happy-opfs/blob/1ca6e66c9ddde628f35ecf68e910628f2b61ed78/src/fs/defines.ts#L112) |
