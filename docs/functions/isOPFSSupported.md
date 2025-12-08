[**happy-opfs**](../README.md)

***

[happy-opfs](../README.md) / isOPFSSupported

# Function: isOPFSSupported()

```ts
function isOPFSSupported(): boolean
```

Defined in: [fs/support.ts:16](https://github.com/JiangJie/happy-opfs/blob/dd0edb865892acc2abe55bcb047ccf0f8773705c/src/fs/support.ts#L16)

Checks if the Origin Private File System (OPFS) is supported in the current environment.
OPFS requires a secure context (HTTPS or localhost) and browser support.

## Returns

`boolean`

`true` if OPFS is supported, `false` otherwise.

## Example

```typescript
if (isOPFSSupported()) {
    // Use OPFS APIs
    const result = await readFile('/path/to/file');
} else {
    console.warn('OPFS is not supported in this environment');
}
```
