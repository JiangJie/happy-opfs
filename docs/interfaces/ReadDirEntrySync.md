[**happy-opfs**](../README.md)

***

[happy-opfs](../README.md) / ReadDirEntrySync

# Interface: ReadDirEntrySync

Defined in: [fs/defines.ts:125](https://github.com/JiangJie/happy-opfs/blob/dd0edb865892acc2abe55bcb047ccf0f8773705c/src/fs/defines.ts#L125)

An entry returned by `readDirSync`.
Similar to `ReadDirEntry` but uses serializable `FileSystemHandleLike`.

## Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="handle"></a> `handle` | [`FileSystemHandleLike`](FileSystemHandleLike.md) | The serializable handle-like object of the entry. Use `isFileHandleLike()` to check if it's a file. | [fs/defines.ts:135](https://github.com/JiangJie/happy-opfs/blob/dd0edb865892acc2abe55bcb047ccf0f8773705c/src/fs/defines.ts#L135) |
| <a id="path"></a> `path` | `string` | The relative path of the entry from the `readDirSync` path parameter. | [fs/defines.ts:129](https://github.com/JiangJie/happy-opfs/blob/dd0edb865892acc2abe55bcb047ccf0f8773705c/src/fs/defines.ts#L129) |
