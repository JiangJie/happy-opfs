export { assertAbsolutePath, assertFileUrl } from './fs/assertions.ts';
export { NOT_FOUND_ERROR } from './fs/constants.ts';
export { FileEncoding, type ExistsOptions, type FsAsyncResult, type ReadFileContent, type ReadOptions, type WriteFileContent, type WriteOptions } from './fs/defines.ts';
export { isCurrentDir, isOPFSSupported, isRootPath } from './fs/helpers.ts';
export { mkdir, readDir, readFile, remove, rename, stat, writeFile } from './fs/opfs_core.ts';
export { appendFile, downloadFile, exists, readBlobFile, readTextFile } from './fs/opfs_ext.ts';
