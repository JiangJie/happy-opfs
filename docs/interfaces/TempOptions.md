[**happy-opfs**](../README.md) • **Docs**

***

[happy-opfs](../README.md) / TempOptions

# Interface: TempOptions

Options for `mkTemp`.

## Properties

| Property | Type | Default value | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| `basename?` | `string` | `tmp` | The basename of the file or directory. eg: `mktemp -t basename.XXX` | [fs/defines.ts:247](https://github.com/JiangJie/happy-opfs/blob/a6314c4612c605f77895adcb9d6d91abcaafaa7d/src/fs/defines.ts#L247) |
| `extname?` | `string` | `undefined` | The extension of the file. eg: `mktemp --suffix .txt` | [fs/defines.ts:253](https://github.com/JiangJie/happy-opfs/blob/a6314c4612c605f77895adcb9d6d91abcaafaa7d/src/fs/defines.ts#L253) |
| `isDirectory?` | `boolean` | `false` | Whether to create a directory. eg: `mktemp -d` | [fs/defines.ts:240](https://github.com/JiangJie/happy-opfs/blob/a6314c4612c605f77895adcb9d6d91abcaafaa7d/src/fs/defines.ts#L240) |
