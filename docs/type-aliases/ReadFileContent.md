[**happy-opfs**](../README.md)

***

[happy-opfs](../README.md) / ReadFileContent

# Type Alias: ReadFileContent

```ts
type ReadFileContent = ArrayBuffer | File | string;
```

Defined in: [fs/defines.ts:22](https://github.com/JiangJie/happy-opfs/blob/1ca6e66c9ddde628f35ecf68e910628f2b61ed78/src/fs/defines.ts#L22)

Represents the possible content types that can be read from a file.
The actual type depends on the `encoding` option:
- `'binary'`: `ArrayBuffer`
- `'utf8'`: `string`
- `'blob'`: `File`
