[**happy-opfs**](../README.md)

***

[happy-opfs](../README.md) / FileSystemFileHandleLike

# Interface: FileSystemFileHandleLike

Defined in: [fs/defines.ts:138](https://github.com/JiangJie/happy-opfs/blob/7d6f4902eef2f34868c7991f5501261a1d1ff67a/src/fs/defines.ts#L138)

A handle to a file or directory returned by `statSync`.

## Extends

- [`FileSystemHandleLike`](FileSystemHandleLike.md)

## Properties

| Property | Type | Description | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="kind"></a> `kind` | `FileSystemHandleKind` | The kind of the entry. | [`FileSystemHandleLike`](FileSystemHandleLike.md).[`kind`](FileSystemHandleLike.md#kind) | [fs/defines.ts:135](https://github.com/JiangJie/happy-opfs/blob/7d6f4902eef2f34868c7991f5501261a1d1ff67a/src/fs/defines.ts#L135) |
| <a id="lastmodified"></a> `lastModified` | `number` | The last modified time of the file. | - | [fs/defines.ts:152](https://github.com/JiangJie/happy-opfs/blob/7d6f4902eef2f34868c7991f5501261a1d1ff67a/src/fs/defines.ts#L152) |
| <a id="name"></a> `name` | `string` | The name of the entry. | [`FileSystemHandleLike`](FileSystemHandleLike.md).[`name`](FileSystemHandleLike.md#name) | [fs/defines.ts:130](https://github.com/JiangJie/happy-opfs/blob/7d6f4902eef2f34868c7991f5501261a1d1ff67a/src/fs/defines.ts#L130) |
| <a id="size"></a> `size` | `number` | The size of the file. | - | [fs/defines.ts:147](https://github.com/JiangJie/happy-opfs/blob/7d6f4902eef2f34868c7991f5501261a1d1ff67a/src/fs/defines.ts#L147) |
| <a id="type"></a> `type` | `string` | The type of the file. | - | [fs/defines.ts:142](https://github.com/JiangJie/happy-opfs/blob/7d6f4902eef2f34868c7991f5501261a1d1ff67a/src/fs/defines.ts#L142) |
