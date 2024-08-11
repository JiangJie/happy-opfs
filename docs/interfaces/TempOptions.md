[**happy-opfs**](../README.md) • **Docs**

***

[happy-opfs](../README.md) / TempOptions

# Interface: TempOptions

Options for `mkTemp`.

## Properties

| Property | Type | Default value | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| `basename?` | `string` | `tmp` | The basename of the file or directory. eg: `mktemp -t basename.XXX` | [fs/defines.ts:247](https://github.com/JiangJie/happy-opfs/blob/7bfec3b71684ddcf0fe3092672c66c9664776bcc/src/fs/defines.ts#L247) |
| `extname?` | `string` | `undefined` | The extension of the file. eg: `mktemp --suffix .txt` | [fs/defines.ts:253](https://github.com/JiangJie/happy-opfs/blob/7bfec3b71684ddcf0fe3092672c66c9664776bcc/src/fs/defines.ts#L253) |
| `isDirectory?` | `boolean` | `false` | Whether to create a directory. eg: `mktemp -d` | [fs/defines.ts:240](https://github.com/JiangJie/happy-opfs/blob/7bfec3b71684ddcf0fe3092672c66c9664776bcc/src/fs/defines.ts#L240) |
