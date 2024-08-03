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
| `kind` | `FileSystemHandleKind` | The kind of the entry. | [fs/defines.ts:133](https://github.com/JiangJie/happy-opfs/blob/ff451a853f34b3dedd716c1414a17eb57f239434/src/fs/defines.ts#L133) |
| `name` | `string` | The name of the entry. | [fs/defines.ts:128](https://github.com/JiangJie/happy-opfs/blob/ff451a853f34b3dedd716c1414a17eb57f239434/src/fs/defines.ts#L128) |
