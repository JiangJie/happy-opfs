[**happy-opfs**](../README.md)

***

[happy-opfs](../README.md) / FileSystemHandleLike

# Interface: FileSystemHandleLike

Defined in: [fs/defines.ts:126](https://github.com/JiangJie/happy-opfs/blob/7d6f4902eef2f34868c7991f5501261a1d1ff67a/src/fs/defines.ts#L126)

A handle to a file or directory returned by `statSync`.

## Extended by

- [`FileSystemFileHandleLike`](FileSystemFileHandleLike.md)

## Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="kind"></a> `kind` | `FileSystemHandleKind` | The kind of the entry. | [fs/defines.ts:135](https://github.com/JiangJie/happy-opfs/blob/7d6f4902eef2f34868c7991f5501261a1d1ff67a/src/fs/defines.ts#L135) |
| <a id="name"></a> `name` | `string` | The name of the entry. | [fs/defines.ts:130](https://github.com/JiangJie/happy-opfs/blob/7d6f4902eef2f34868c7991f5501261a1d1ff67a/src/fs/defines.ts#L130) |
