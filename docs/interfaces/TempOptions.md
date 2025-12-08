[**happy-opfs**](../README.md)

***

[happy-opfs](../README.md) / TempOptions

# Interface: TempOptions

Defined in: [fs/defines.ts:262](https://github.com/JiangJie/happy-opfs/blob/1ca6e66c9ddde628f35ecf68e910628f2b61ed78/src/fs/defines.ts#L262)

Options for `mkTemp`.

## Properties

| Property | Type | Default value | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="basename"></a> `basename?` | `string` | `tmp` | The basename of the file or directory. eg: `mktemp -t basename.XXX` | [fs/defines.ts:275](https://github.com/JiangJie/happy-opfs/blob/1ca6e66c9ddde628f35ecf68e910628f2b61ed78/src/fs/defines.ts#L275) |
| <a id="extname"></a> `extname?` | `string` | `undefined` | The extension of the file. eg: `mktemp --suffix .txt` | [fs/defines.ts:281](https://github.com/JiangJie/happy-opfs/blob/1ca6e66c9ddde628f35ecf68e910628f2b61ed78/src/fs/defines.ts#L281) |
| <a id="isdirectory"></a> `isDirectory?` | `boolean` | `false` | Whether to create a directory. eg: `mktemp -d` | [fs/defines.ts:268](https://github.com/JiangJie/happy-opfs/blob/1ca6e66c9ddde628f35ecf68e910628f2b61ed78/src/fs/defines.ts#L268) |
