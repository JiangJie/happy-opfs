**happy-opfs**

***

# happy-opfs

## Classes

| Class | Description |
| ------ | ------ |
| [SyncMessenger](classes/SyncMessenger.md) | Messenger for synchronous communication between main thread and worker thread. Inspired by [memfs](https://github.com/streamich/memfs/blob/master/src/fsa-to-node/worker/SyncMessenger.ts). |

## Interfaces

| Interface | Description |
| ------ | ------ |
| [CopyOptions](interfaces/CopyOptions.md) | Options for `copy`. |
| [DownloadFileTempResponse](interfaces/DownloadFileTempResponse.md) | Result of `downloadFile` when the file is saved to a temporary path. |
| [ErrorLike](interfaces/ErrorLike.md) | Serializable version of Error. |
| [ExistsOptions](interfaces/ExistsOptions.md) | Options to determine the existence of a file or directory. |
| [FileLike](interfaces/FileLike.md) | Serializable version of File. |
| [FileSystemFileHandleLike](interfaces/FileSystemFileHandleLike.md) | A serializable representation of a file handle with additional metadata. Extends `FileSystemHandleLike` with file-specific properties. |
| [FileSystemHandleLike](interfaces/FileSystemHandleLike.md) | A serializable representation of a file or directory handle. Returned by `statSync` and used in `ReadDirEntrySync`. |
| [MoveOptions](interfaces/MoveOptions.md) | Options for `move`. |
| [ReadDirEntry](interfaces/ReadDirEntry.md) | An entry returned by `readDir`. |
| [ReadDirEntrySync](interfaces/ReadDirEntrySync.md) | An entry returned by `readDirSync`. Similar to `ReadDirEntry` but uses serializable `FileSystemHandleLike`. |
| [ReadDirOptions](interfaces/ReadDirOptions.md) | Options for reading directories. |
| [ReadOptions](interfaces/ReadOptions.md) | Options for reading files with specified encoding. |
| [SyncAgentOptions](interfaces/SyncAgentOptions.md) | Setup options for `connectSyncAgent`. |
| [TempOptions](interfaces/TempOptions.md) | Options for `mkTemp`. |
| [UploadRequestInit](interfaces/UploadRequestInit.md) | fetch-t request options for uploading files. |
| [WriteOptions](interfaces/WriteOptions.md) | Options for writing files, including flags for creation and appending. |
| [ZipOptions](interfaces/ZipOptions.md) | Options for `zip`. |

## Type Aliases

| Type alias | Description |
| ------ | ------ |
| [FileEncoding](type-aliases/FileEncoding.md) | Supported file encodings for reading files. - `'binary'`: Returns raw `ArrayBuffer` - `'utf8'`: Returns decoded `string` - `'blob'`: Returns `File` object with metadata |
| [FsRequestInit](type-aliases/FsRequestInit.md) | fetch-t options for download and upload. |
| [ReadFileContent](type-aliases/ReadFileContent.md) | Represents the possible content types that can be read from a file. The actual type depends on the `encoding` option: - `'binary'`: `ArrayBuffer` - `'utf8'`: `string` - `'blob'`: `File` |
| [WriteFileContent](type-aliases/WriteFileContent.md) | Represents the possible content types that can be written to a file asynchronously. Includes `BufferSource` (ArrayBuffer or TypedArray), `Blob`, or `string`. |
| [WriteSyncFileContent](type-aliases/WriteSyncFileContent.md) | Represents the possible content types that can be written to a file synchronously. Excludes `Blob` since it requires async operations to read. |

## Variables

| Variable | Description |
| ------ | ------ |
| [NO\_STRATEGY\_ERROR](variables/NO_STRATEGY_ERROR.md) | No strategy for the requested operation is viable. |
| [NOT\_FOUND\_ERROR](variables/NOT_FOUND_ERROR.md) | A constant representing the error thrown when a file or directory is not found. Name of DOMException.NOT_FOUND_ERR. |
| [ROOT\_DIR](variables/ROOT_DIR.md) | A constant representing the root directory path. |
| [TMP\_DIR](variables/TMP_DIR.md) | A constant representing the temporary directory path. |

## Functions

| Function | Description |
| ------ | ------ |
| [appendFile](functions/appendFile.md) | Appends content to a file at the specified path. Creates the file if it doesn't exist. |
| [appendFileSync](functions/appendFileSync.md) | Synchronous version of `appendFile`. Appends content to a file at the specified path. |
| [assertAbsolutePath](functions/assertAbsolutePath.md) | Asserts that the provided path is an absolute path. |
| [assertFileUrl](functions/assertFileUrl.md) | Asserts that the provided URL is a valid file URL. |
| [connectSyncAgent](functions/connectSyncAgent.md) | Connects to a sync agent worker for synchronous file system operations. Must be called before using any sync API functions. |
| [copy](functions/copy.md) | Copies a file or directory from one location to another, similar to `cp -r`. Both source and destination must be of the same type (both files or both directories). |
| [copySync](functions/copySync.md) | Synchronous version of `copy`. Copies a file or directory from one location to another. |
| [createFile](functions/createFile.md) | Creates a new empty file at the specified path, similar to the `touch` command. If the file already exists, this operation succeeds without modifying it. Parent directories are created automatically if they don't exist. |
| [createFileSync](functions/createFileSync.md) | Synchronous version of `createFile`. Creates a new empty file at the specified path. |
| [deleteTemp](functions/deleteTemp.md) | Deletes the entire temporary directory (`/tmp`) and all its contents. |
| [deleteTempSync](functions/deleteTempSync.md) | Synchronous version of `deleteTemp`. Deletes the temporary directory and all its contents. |
| [downloadFile](functions/downloadFile.md) | Downloads a file from a URL and saves it to a temporary file. The returned response will contain the temporary file path. |
| [emptyDir](functions/emptyDir.md) | Empties all contents of a directory at the specified path. If the directory doesn't exist, it will be created. |
| [emptyDirSync](functions/emptyDirSync.md) | Synchronous version of `emptyDir`. Removes all contents of a directory. |
| [exists](functions/exists.md) | Checks whether a file or directory exists at the specified path. |
| [existsSync](functions/existsSync.md) | Synchronous version of `exists`. Checks whether a file or directory exists at the specified path. |
| [generateTempPath](functions/generateTempPath.md) | Generates a unique temporary file or directory path without creating it. Uses `crypto.randomUUID()` to ensure uniqueness. |
| [getFileDataByHandle](functions/getFileDataByHandle.md) | Reads the binary data from a file handle. |
| [getSyncMessenger](functions/getSyncMessenger.md) | Gets the current sync messenger instance. Can be used to share the messenger with other environments. |
| [isDirectoryHandle](functions/isDirectoryHandle.md) | Checks whether the given handle is a directory handle. |
| [isFileHandle](functions/isFileHandle.md) | Checks whether the given handle is a file handle. |
| [isFileHandleLike](functions/isFileHandleLike.md) | Checks whether the given handle-like object represents a file. |
| [isOPFSSupported](functions/isOPFSSupported.md) | Checks if the Origin Private File System (OPFS) is supported in the current environment. OPFS requires a secure context (HTTPS or localhost) and browser support. |
| [isTempPath](functions/isTempPath.md) | Checks whether the path is a temporary path (under `/tmp`). |
| [mkdir](functions/mkdir.md) | Creates a new directory at the specified path, similar to `mkdir -p`. Creates all necessary parent directories if they don't exist. |
| [mkdirSync](functions/mkdirSync.md) | Synchronous version of `mkdir`. Creates a directory at the specified path, including any necessary parent directories. |
| [mkTemp](functions/mkTemp.md) | Creates a temporary file or directory in the `/tmp` directory. Uses `crypto.randomUUID()` to generate a unique name. |
| [mkTempSync](functions/mkTempSync.md) | Synchronous version of `mkTemp`. Creates a temporary file or directory. |
| [move](functions/move.md) | Moves a file or directory from one location to another. Both source and destination must be of the same type (both files or both directories). |
| [moveSync](functions/moveSync.md) | Synchronous version of `move`. Moves a file or directory from one location to another. |
| [pruneTemp](functions/pruneTemp.md) | Removes expired files from the temporary directory. Only removes files whose `lastModified` time is before the specified date. |
| [pruneTempSync](functions/pruneTempSync.md) | Synchronous version of `pruneTemp`. Removes expired files from the temporary directory. |
| [readBlobFile](functions/readBlobFile.md) | Reads the content of a file as a `File` object (Blob with name). |
| [readBlobFileSync](functions/readBlobFileSync.md) | Synchronous version of `readBlobFile`. Reads a file as a `FileLike` object. |
| [readDir](functions/readDir.md) | Reads the contents of a directory at the specified path. |
| [readDirSync](functions/readDirSync.md) | Synchronous version of `readDir`. Reads the contents of a directory. |
| [readFile](functions/readFile.md) | Reads the content of a file at the specified path with the specified options. |
| [readFileStream](functions/readFileStream.md) | Opens a file and returns a readable stream for reading its contents. Useful for processing large files without loading them entirely into memory. |
| [readFileSync](functions/readFileSync.md) | Synchronous version of `readFile`. Reads the content of a file with the specified encoding. |
| [readJsonFile](functions/readJsonFile.md) | Reads a JSON file and parses its content. |
| [readJsonFileSync](functions/readJsonFileSync.md) | Synchronous version of `readJsonFile`. Reads and parses a JSON file. |
| [readTextFile](functions/readTextFile.md) | Reads a file as a UTF-8 string. |
| [readTextFileSync](functions/readTextFileSync.md) | Synchronous version of `readTextFile`. Reads a file as a UTF-8 string. |
| [remove](functions/remove.md) | Removes a file or directory at the specified path, similar to `rm -rf`. If the path doesn't exist, the operation succeeds silently. |
| [removeSync](functions/removeSync.md) | Synchronous version of `remove`. Removes a file or directory at the specified path. |
| [setSyncMessenger](functions/setSyncMessenger.md) | Sets the sync messenger instance. Used to share a messenger from another environment. |
| [startSyncAgent](functions/startSyncAgent.md) | Starts the sync agent in a Web Worker. Listens for a SharedArrayBuffer from the main thread and begins processing requests. |
| [stat](functions/stat.md) | Retrieves the `FileSystemHandle` for a file or directory at the specified path. Can be used to check the type (file or directory) and access metadata. |
| [statSync](functions/statSync.md) | Synchronous version of `stat`. Retrieves metadata about a file or directory. |
| [toFileSystemHandleLike](functions/toFileSystemHandleLike.md) | Serialize a `FileSystemHandle` to plain object. |
| [unzip](functions/unzip.md) | Unzip a zip file to a directory. Equivalent to `unzip -o <zipFilePath> -d <targetPath> |
| [unzipFromUrl](functions/unzipFromUrl.md) | Unzip a remote zip file to a directory. Equivalent to `unzip -o <zipFilePath> -d <targetPath> |
| [unzipSync](functions/unzipSync.md) | Synchronous version of `unzip`. Extracts a zip file to a directory. |
| [uploadFile](functions/uploadFile.md) | Uploads a file from the specified path to a URL. |
| [writeFile](functions/writeFile.md) | Writes content to a file at the specified path. Creates the file and parent directories if they don't exist (unless `create: false`). |
| [writeFileStream](functions/writeFileStream.md) | Opens a file and returns a writable stream for writing contents. Useful for writing large files without loading them entirely into memory. The caller is responsible for closing the stream when done. |
| [writeFileSync](functions/writeFileSync.md) | Synchronous version of `writeFile`. Writes content to a file at the specified path. |
| [writeJsonFile](functions/writeJsonFile.md) | Writes an object to a file as JSON. |
| [writeJsonFileSync](functions/writeJsonFileSync.md) | Synchronous version of `writeJsonFile`. Writes an object to a file as JSON. |
| [zip](functions/zip.md) | Zip a file or directory and write to a zip file. Equivalent to `zip -r <zipFilePath> <targetPath>`. |
| [zipFromUrl](functions/zipFromUrl.md) | Zip a remote file and write to a zip file. |
| [zipSync](functions/zipSync.md) | Synchronous version of `zip`. Zips a file or directory. |
