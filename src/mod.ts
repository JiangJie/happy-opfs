export { assertAbsolutePath, assertPath } from './fs/asserts.ts';
export { FileEncoding, type ExistsOptions, type FsAsyncResult, type ReadFileContent, type ReadOptions, type WriteFileContent, type WriteOptions } from './fs/defines.ts';
export { isCurrentDir, isOPFSSupported, isRootPath } from './fs/helpers.ts';
export { mkdir, readDir, readFile, remove, rename, stat, writeFile } from './fs/opfs_core.ts';
export { appendFile, exists, readBlobFile, readTextFile } from './fs/opfs_ext.ts';
