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
| `kind` | `FileSystemHandleKind` | The kind of the entry. | [fs/defines.ts:135](https://github.com/JiangJie/happy-opfs/blob/1fc39add615fcd3c1ee38b13edeb0d38cd3481c4/src/fs/defines.ts#L135) |
| `name` | `string` | The name of the entry. | [fs/defines.ts:130](https://github.com/JiangJie/happy-opfs/blob/1fc39add615fcd3c1ee38b13edeb0d38cd3481c4/src/fs/defines.ts#L130) |
