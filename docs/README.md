**happy-opfs** • **Docs**

***

# happy-opfs

## Interfaces

| Interface | Description |
| ------ | ------ |
| [CopyOptions](interfaces/CopyOptions.md) | Options for `copy`. |
| [DownloadFileTempResponse](interfaces/DownloadFileTempResponse.md) | Result of `downloadFile` when the file is saved to a temporary path. |
| [ErrorLike](interfaces/ErrorLike.md) | Serializable version of Error. |
| [ExistsOptions](interfaces/ExistsOptions.md) | Options to determine the existence of a file or directory. |
| [FileLike](interfaces/FileLike.md) | Serializable version of File. |
| [FileSystemFileHandleLike](interfaces/FileSystemFileHandleLike.md) | A handle to a file or directory returned by `statSync`. |
| [FileSystemHandleLike](interfaces/FileSystemHandleLike.md) | A handle to a file or directory returned by `statSync`. |
| [MoveOptions](interfaces/MoveOptions.md) | Options for `move`. |
| [ReadDirEntry](interfaces/ReadDirEntry.md) | An entry returned by `readDir`. |
| [ReadDirEntrySync](interfaces/ReadDirEntrySync.md) | An entry returned by `readDirSync`. |
| [ReadDirOptions](interfaces/ReadDirOptions.md) | Options for reading directories. |
| [ReadOptions](interfaces/ReadOptions.md) | Options for reading files with specified encoding. |
| [SyncAgentOptions](interfaces/SyncAgentOptions.md) | Setup options of `connectSyncAgent`. |
| [TempOptions](interfaces/TempOptions.md) | Options for `mkTemp`. |
| [UploadRequestInit](interfaces/UploadRequestInit.md) | fetch-t request options for uploading files. |
| [WriteOptions](interfaces/WriteOptions.md) | Options for writing files, including flags for creation and appending. |
| [ZipOptions](interfaces/ZipOptions.md) | Options for `zip`. |

## Type Aliases

| Type alias | Description |
| ------ | ------ |
| [FileEncoding](type-aliases/FileEncoding.md) | Supported file encodings for reading and writing files. |
| [FsRequestInit](type-aliases/FsRequestInit.md) | fetch-t options for download and upload. |
| [ReadFileContent](type-aliases/ReadFileContent.md) | Represents the possible content types that can be read from a file. |
| [WriteFileContent](type-aliases/WriteFileContent.md) | Represents the possible content types that can be written to a file. |
| [WriteSyncFileContent](type-aliases/WriteSyncFileContent.md) | Represents the possible content types that can be written synchronously to a file. |

## Variables

| Variable | Description |
| ------ | ------ |
| [CURRENT\_DIR](variables/CURRENT_DIR.md) | A constant representing the current directory path. |
| [NOT\_FOUND\_ERROR](variables/NOT_FOUND_ERROR.md) | A constant representing the error thrown when a file or directory is not found. Name of DOMException.NOT_FOUND_ERR. |
| [ROOT\_DIR](variables/ROOT_DIR.md) | A constant representing the root directory path. |
| [TMP\_DIR](variables/TMP_DIR.md) | A constant representing the temporary directory path. |

## Functions

| Function | Description |
| ------ | ------ |
| [appendFile](functions/appendFile.md) | Appends content to a file at the specified path. |
| [appendFileSync](functions/appendFileSync.md) | Sync version of `appendFile`. |
| [assertAbsolutePath](functions/assertAbsolutePath.md) | Asserts that the provided path is an absolute path. |
| [assertFileUrl](functions/assertFileUrl.md) | Asserts that the provided URL is a valid file URL. |
| [connectSyncAgent](functions/connectSyncAgent.md) | Communicate with worker. |
| [copy](functions/copy.md) | Copies a file or directory from one location to another same as `cp -r`. |
| [copySync](functions/copySync.md) | Sync version of `copy`. |
| [createFile](functions/createFile.md) | Creates a new file at the specified path same as `touch`. |
| [createFileSync](functions/createFileSync.md) | Sync version of `createFile`. |
| [deleteTemp](functions/deleteTemp.md) | Delete the temporary directory and all its contents. |
| [deleteTempSync](functions/deleteTempSync.md) | Sync version of `deleteTemp`. |
| [downloadFile](functions/downloadFile.md) | Downloads a file from a URL and saves it to a temporary file. The returned response will contain the temporary file path. |
| [emptyDir](functions/emptyDir.md) | Empties the contents of a directory at the specified path. |
| [emptyDirSync](functions/emptyDirSync.md) | Sync version of `emptyDir`. |
| [exists](functions/exists.md) | Checks whether a file or directory exists at the specified path. |
| [existsSync](functions/existsSync.md) | Sync version of `exists`. |
| [generateTempPath](functions/generateTempPath.md) | Generate a temporary path but not create it. |
| [getFileDataByHandle](functions/getFileDataByHandle.md) | Gets the data of a file handle. |
| [isDirectoryHandle](functions/isDirectoryHandle.md) | Whether the handle is a directory. |
| [isFileHandle](functions/isFileHandle.md) | Whether the handle is a file. |
| [isFileHandleLike](functions/isFileHandleLike.md) | Whether the handle is a file-like. |
| [isOPFSSupported](functions/isOPFSSupported.md) | Checks if the Origin Private File System (OPFS) is supported in the current environment. |
| [isTempPath](functions/isTempPath.md) | Check whether the path is a temporary path. |
| [mkTemp](functions/mkTemp.md) | Create a temporary file or directory. |
| [mkTempSync](functions/mkTempSync.md) | Sync version of `mkTemp`. |
| [mkdir](functions/mkdir.md) | Creates a new directory at the specified path same as `mkdir -p`. |
| [mkdirSync](functions/mkdirSync.md) | Sync version of `mkdir`. |
| [move](functions/move.md) | Move a file or directory from an old path to a new path. |
| [moveSync](functions/moveSync.md) | Sync version of `move`. |
| [pruneTemp](functions/pruneTemp.md) | Prune the temporary directory and delete all expired files. |
| [pruneTempSync](functions/pruneTempSync.md) | Sync version of `pruneTemp`. |
| [readBlobFile](functions/readBlobFile.md) | Reads the content of a file at the specified path as a File. |
| [readBlobFileSync](functions/readBlobFileSync.md) | Sync version of `readBlobFile`. |
| [readDir](functions/readDir.md) | Reads the contents of a directory at the specified path. |
| [readDirSync](functions/readDirSync.md) | Sync version of `readDir`. |
| [readFile](functions/readFile.md) | Reads the content of a file at the specified path as a File. |
| [readFileSync](functions/readFileSync.md) | Sync version of `readFile`. |
| [readTextFile](functions/readTextFile.md) | Reads the content of a file at the specified path as a string. |
| [readTextFileSync](functions/readTextFileSync.md) | Sync version of `readTextFile`. |
| [remove](functions/remove.md) | Removes a file or directory at the specified path same as `rm -rf`. |
| [removeSync](functions/removeSync.md) | Sync version of `remove`. |
| [startSyncAgent](functions/startSyncAgent.md) | Start worker agent. Listens to postMessage from main thread. Start runner loop. |
| [stat](functions/stat.md) | Retrieves the status of a file or directory at the specified path. |
| [statSync](functions/statSync.md) | Sync version of `stat`. |
| [toFileSystemHandleLike](functions/toFileSystemHandleLike.md) | Serialize a `FileSystemHandle` to plain object. |
| [unzip](functions/unzip.md) | Unzip a zip file to a directory. Equivalent to `unzip -o <zipFilePath> -d <targetPath> |
| [unzipFromUrl](functions/unzipFromUrl.md) | Unzip a remote zip file to a directory. Equivalent to `unzip -o <zipFilePath> -d <targetPath> |
| [unzipSync](functions/unzipSync.md) | Sync version of `unzip`. |
| [uploadFile](functions/uploadFile.md) | Uploads a file from the specified path to a URL. |
| [writeFile](functions/writeFile.md) | Writes content to a file at the specified path. |
| [writeFileSync](functions/writeFileSync.md) | Sync version of `writeFile`. |
| [zip](functions/zip.md) | Zip a file or directory and write to a zip file. Equivalent to `zip -r <zipFilePath> <targetPath>`. |
| [zipFromUrl](functions/zipFromUrl.md) | Zip a remote file and write to a zip file. |
| [zipSync](functions/zipSync.md) | Sync version of `zip`. |
