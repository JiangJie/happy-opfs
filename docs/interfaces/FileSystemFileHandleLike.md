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
| `kind` | `FileSystemHandleKind` | The kind of the entry. | [`FileSystemHandleLike`](FileSystemHandleLike.md).`kind` | [fs/defines.ts:135](https://github.com/JiangJie/happy-opfs/blob/41bfb9280ee562c4a8708809308f96d116edb112/src/fs/defines.ts#L135) |
| `lastModified` | `number` | The last modified time of the file. | - | [fs/defines.ts:152](https://github.com/JiangJie/happy-opfs/blob/41bfb9280ee562c4a8708809308f96d116edb112/src/fs/defines.ts#L152) |
| `name` | `string` | The name of the entry. | [`FileSystemHandleLike`](FileSystemHandleLike.md).`name` | [fs/defines.ts:130](https://github.com/JiangJie/happy-opfs/blob/41bfb9280ee562c4a8708809308f96d116edb112/src/fs/defines.ts#L130) |
| `size` | `number` | The size of the file. | - | [fs/defines.ts:147](https://github.com/JiangJie/happy-opfs/blob/41bfb9280ee562c4a8708809308f96d116edb112/src/fs/defines.ts#L147) |
| `type` | `string` | The type of the file. | - | [fs/defines.ts:142](https://github.com/JiangJie/happy-opfs/blob/41bfb9280ee562c4a8708809308f96d116edb112/src/fs/defines.ts#L142) |
