[**happy-opfs**](../README.md)

***

[happy-opfs](../README.md) / WriteSyncFileContent

# Type Alias: WriteSyncFileContent

```ts
type WriteSyncFileContent = BufferSource | string;
```

Defined in: [fs/defines.ts:13](https://github.com/JiangJie/happy-opfs/blob/dd0edb865892acc2abe55bcb047ccf0f8773705c/src/fs/defines.ts#L13)

Represents the possible content types that can be written to a file synchronously.
Excludes `Blob` since it requires async operations to read.
