[**happy-opfs**](../README.md)

***

[happy-opfs](../README.md) / ReadFileContent

# Type Alias: ReadFileContent

```ts
type ReadFileContent = ArrayBuffer | File | string;
```

Defined in: [fs/defines.ts:22](https://github.com/JiangJie/happy-opfs/blob/dd0edb865892acc2abe55bcb047ccf0f8773705c/src/fs/defines.ts#L22)

Represents the possible content types that can be read from a file.
The actual type depends on the `encoding` option:
- `'binary'`: `ArrayBuffer`
- `'utf8'`: `string`
- `'blob'`: `File`
