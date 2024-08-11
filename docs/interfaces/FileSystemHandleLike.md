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
| `kind` | `FileSystemHandleKind` | The kind of the entry. | [fs/defines.ts:135](https://github.com/JiangJie/happy-opfs/blob/7bfec3b71684ddcf0fe3092672c66c9664776bcc/src/fs/defines.ts#L135) |
| `name` | `string` | The name of the entry. | [fs/defines.ts:130](https://github.com/JiangJie/happy-opfs/blob/7bfec3b71684ddcf0fe3092672c66c9664776bcc/src/fs/defines.ts#L130) |
