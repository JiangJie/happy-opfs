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
| `kind` | `FileSystemHandleKind` | The kind of the entry. | [`FileSystemHandleLike`](FileSystemHandleLike.md).`kind` | [fs/defines.ts:135](https://github.com/JiangJie/happy-opfs/blob/a6314c4612c605f77895adcb9d6d91abcaafaa7d/src/fs/defines.ts#L135) |
| `lastModified` | `number` | The last modified time of the file. | - | [fs/defines.ts:152](https://github.com/JiangJie/happy-opfs/blob/a6314c4612c605f77895adcb9d6d91abcaafaa7d/src/fs/defines.ts#L152) |
| `name` | `string` | The name of the entry. | [`FileSystemHandleLike`](FileSystemHandleLike.md).`name` | [fs/defines.ts:130](https://github.com/JiangJie/happy-opfs/blob/a6314c4612c605f77895adcb9d6d91abcaafaa7d/src/fs/defines.ts#L130) |
| `size` | `number` | The size of the file. | - | [fs/defines.ts:147](https://github.com/JiangJie/happy-opfs/blob/a6314c4612c605f77895adcb9d6d91abcaafaa7d/src/fs/defines.ts#L147) |
| `type` | `string` | The type of the file. | - | [fs/defines.ts:142](https://github.com/JiangJie/happy-opfs/blob/a6314c4612c605f77895adcb9d6d91abcaafaa7d/src/fs/defines.ts#L142) |
