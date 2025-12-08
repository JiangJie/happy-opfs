[**happy-opfs**](../README.md)

***

[happy-opfs](../README.md) / WriteFileContent

# Type Alias: WriteFileContent

```ts
type WriteFileContent = BufferSource | Blob | string;
```

Defined in: [fs/defines.ts:7](https://github.com/JiangJie/happy-opfs/blob/1ca6e66c9ddde628f35ecf68e910628f2b61ed78/src/fs/defines.ts#L7)

Represents the possible content types that can be written to a file asynchronously.
Includes `BufferSource` (ArrayBuffer or TypedArray), `Blob`, or `string`.
