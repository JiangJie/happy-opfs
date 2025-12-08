[**happy-opfs**](../README.md)

***

[happy-opfs](../README.md) / ZipOptions

# Interface: ZipOptions

Defined in: [fs/defines.ts:249](https://github.com/JiangJie/happy-opfs/blob/1ca6e66c9ddde628f35ecf68e910628f2b61ed78/src/fs/defines.ts#L249)

Options for `zip`.

## Properties

| Property | Type | Default value | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="preserveroot"></a> `preserveRoot?` | `boolean` | `true` | Whether to preserve the root directory name in the zip file structure. - `true`: `/path/to/folder` → `folder/file1.txt`, `folder/file2.txt` - `false`: `/path/to/folder` → `file1.txt`, `file2.txt` | [fs/defines.ts:256](https://github.com/JiangJie/happy-opfs/blob/1ca6e66c9ddde628f35ecf68e910628f2b61ed78/src/fs/defines.ts#L256) |
