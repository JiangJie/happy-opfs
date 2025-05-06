[**happy-opfs**](../README.md)

***

[happy-opfs](../README.md) / TempOptions

# Interface: TempOptions

Defined in: [fs/defines.ts:234](https://github.com/JiangJie/happy-opfs/blob/7d6f4902eef2f34868c7991f5501261a1d1ff67a/src/fs/defines.ts#L234)

Options for `mkTemp`.

## Properties

| Property | Type | Default value | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="basename"></a> `basename?` | `string` | `tmp` | The basename of the file or directory. eg: `mktemp -t basename.XXX` | [fs/defines.ts:247](https://github.com/JiangJie/happy-opfs/blob/7d6f4902eef2f34868c7991f5501261a1d1ff67a/src/fs/defines.ts#L247) |
| <a id="extname"></a> `extname?` | `string` | `undefined` | The extension of the file. eg: `mktemp --suffix .txt` | [fs/defines.ts:253](https://github.com/JiangJie/happy-opfs/blob/7d6f4902eef2f34868c7991f5501261a1d1ff67a/src/fs/defines.ts#L253) |
| <a id="isdirectory"></a> `isDirectory?` | `boolean` | `false` | Whether to create a directory. eg: `mktemp -d` | [fs/defines.ts:240](https://github.com/JiangJie/happy-opfs/blob/7d6f4902eef2f34868c7991f5501261a1d1ff67a/src/fs/defines.ts#L240) |
