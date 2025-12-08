[**happy-opfs**](../README.md)

***

[happy-opfs](../README.md) / FileEncoding

# Type Alias: FileEncoding

```ts
type FileEncoding = "binary" | "utf8" | "blob";
```

Defined in: [fs/defines.ts:75](https://github.com/JiangJie/happy-opfs/blob/1ca6e66c9ddde628f35ecf68e910628f2b61ed78/src/fs/defines.ts#L75)

Supported file encodings for reading files.
- `'binary'`: Returns raw `ArrayBuffer`
- `'utf8'`: Returns decoded `string`
- `'blob'`: Returns `File` object with metadata
