**happy-opfs** • **Docs**

***

# happy-opfs

## Interfaces

| Interface | Description |
| ------ | ------ |
| [ErrorLike](interfaces/ErrorLike.md) | Serializable version of Error. |
| [ExistsOptions](interfaces/ExistsOptions.md) | Options to determine the existence of a file or directory. |
| [FileLike](interfaces/FileLike.md) | Serializable version of File. |
| [FileSystemHandleLike](interfaces/FileSystemHandleLike.md) | A handle to a file or directory returned by `statSync`. |
| [FsRequestInit](interfaces/FsRequestInit.md) | fetch-t options for download and upload. |
| [ReadDirEntry](interfaces/ReadDirEntry.md) | An entry returned by `readDir`. |
| [ReadDirEntrySync](interfaces/ReadDirEntrySync.md) | An entry returned by `readDirSync`. |
| [ReadDirOptions](interfaces/ReadDirOptions.md) | Options for reading directories. |
| [ReadOptions](interfaces/ReadOptions.md) | Options for reading files with specified encoding. |
| [SyncAgentOptions](interfaces/SyncAgentOptions.md) | Setup options of `connectSyncAgent`. |
| [UploadRequestInit](interfaces/UploadRequestInit.md) | fetch-t request options for uploading files. |
| [WriteOptions](interfaces/WriteOptions.md) | Options for writing files, including flags for creation and appending. |

## Type Aliases

| Type alias | Description |
| ------ | ------ |
| [FileEncoding](type-aliases/FileEncoding.md) | Supported file encodings for reading and writing files. |
| [ReadFileContent](type-aliases/ReadFileContent.md) | Represents the possible content types that can be read from a file. |
| [WriteFileContent](type-aliases/WriteFileContent.md) | Represents the possible content types that can be written to a file. |

## Variables

| Variable | Description |
| ------ | ------ |
| [CURRENT\_DIR](variables/CURRENT_DIR.md) | A constant representing the current directory path. |
| [NOT\_FOUND\_ERROR](variables/NOT_FOUND_ERROR.md) | A constant representing the error thrown when a file or directory is not found. Name of DOMException.NOT_FOUND_ERR. |
| [ROOT\_DIR](variables/ROOT_DIR.md) | A constant representing the root directory path. |

## Functions

| Function | Description |
| ------ | ------ |
| [appendFile](functions/appendFile.md) | Appends content to a file at the specified path. |
| [appendFileSync](functions/appendFileSync.md) | Sync version of `appendFile`. |
| [assertAbsolutePath](functions/assertAbsolutePath.md) | Asserts that the provided path is an absolute path. |
| [assertFileUrl](functions/assertFileUrl.md) | Asserts that the provided URL is a valid file URL. |
| [connectSyncAgent](functions/connectSyncAgent.md) | Communicate with worker. |
| [downloadFile](functions/downloadFile.md) | Downloads a file from a URL and saves it to the specified path. |
| [emptyDir](functions/emptyDir.md) | Empties the contents of a directory at the specified path. |
| [emptyDirSync](functions/emptyDirSync.md) | Sync version of `emptyDir`. |
| [exists](functions/exists.md) | Checks whether a file or directory exists at the specified path. |
| [existsSync](functions/existsSync.md) | Sync version of `exists`. |
| [isOPFSSupported](functions/isOPFSSupported.md) | Checks if the Origin Private File System (OPFS) is supported in the current environment. |
| [mkdir](functions/mkdir.md) | Creates a new directory at the specified path same as `mkdir -p`. |
| [mkdirSync](functions/mkdirSync.md) | Sync version of `mkdir`. |
| [readBlobFile](functions/readBlobFile.md) | Reads the content of a file at the specified path as a Blob. |
| [readBlobFileSync](functions/readBlobFileSync.md) | Sync version of `readBlobFile`. |
| [readDir](functions/readDir.md) | Reads the contents of a directory at the specified path. |
| [readDirSync](functions/readDirSync.md) | Sync version of `readDir`. |
| [readFile](functions/readFile.md) | Reads the content of a file at the specified path as a Blob. |
| [readFileSync](functions/readFileSync.md) | Sync version of `readFile`. |
| [readTextFile](functions/readTextFile.md) | Reads the content of a file at the specified path as a string. |
| [readTextFileSync](functions/readTextFileSync.md) | Sync version of `readTextFile`. |
| [remove](functions/remove.md) | Removes a file or directory at the specified path same as `rm -rf`. |
| [removeSync](functions/removeSync.md) | Sync version of `remove`. |
| [rename](functions/rename.md) | Renames a file or directory from an old path to a new path. |
| [renameSync](functions/renameSync.md) | Sync version of `rename`. |
| [startSyncAgent](functions/startSyncAgent.md) | Start worker agent. Listens to postMessage from main thread. Start runner loop. |
| [stat](functions/stat.md) | Retrieves the status of a file or directory at the specified path. |
| [statSync](functions/statSync.md) | Sync version of `stat`. |
| [uploadFile](functions/uploadFile.md) | Uploads a file from the specified path to a URL. |
| [writeFile](functions/writeFile.md) | Writes content to a file at the specified path. |
| [writeFileSync](functions/writeFileSync.md) | Sync version of `writeFile`. |
