[**happy-opfs**](../README.md) • **Docs**

***

[happy-opfs](../README.md) / FileLike

# Interface: FileLike

Serializable version of File.

## Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| `data` | `Uint8Array` | The binary data of the file. Can not use `ArrayBuffer` because it is not serializable. | [fs/defines.ts:197](https://github.com/JiangJie/happy-opfs/blob/584e221ed8f9c25f1e723b7898a60bc25fe8652b/src/fs/defines.ts#L197) |
| `lastModified` | `number` | The last modified time of the file. | [fs/defines.ts:185](https://github.com/JiangJie/happy-opfs/blob/584e221ed8f9c25f1e723b7898a60bc25fe8652b/src/fs/defines.ts#L185) |
| `name` | `string` | The name of the file. | [fs/defines.ts:175](https://github.com/JiangJie/happy-opfs/blob/584e221ed8f9c25f1e723b7898a60bc25fe8652b/src/fs/defines.ts#L175) |
| `size` | `number` | The size of the file. | [fs/defines.ts:190](https://github.com/JiangJie/happy-opfs/blob/584e221ed8f9c25f1e723b7898a60bc25fe8652b/src/fs/defines.ts#L190) |
| `type` | `string` | The type of the file. | [fs/defines.ts:180](https://github.com/JiangJie/happy-opfs/blob/584e221ed8f9c25f1e723b7898a60bc25fe8652b/src/fs/defines.ts#L180) |
