[**happy-opfs**](../README.md)

***

[happy-opfs](../README.md) / WriteFileContent

# Type Alias: WriteFileContent

```ts
type WriteFileContent = BufferSource | Blob | string;
```

Defined in: [fs/defines.ts:7](https://github.com/JiangJie/happy-opfs/blob/dd0edb865892acc2abe55bcb047ccf0f8773705c/src/fs/defines.ts#L7)

Represents the possible content types that can be written to a file asynchronously.
Includes `BufferSource` (ArrayBuffer or TypedArray), `Blob`, or `string`.
