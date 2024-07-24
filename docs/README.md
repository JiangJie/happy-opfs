**happy-opfs** • **Docs**

***

# happy-opfs

## Interfaces

| Interface | Description |
| ------ | ------ |
| [ExistsOptions](interfaces/ExistsOptions.md) | Options to determine the existence of a file or directory. |
| [FsRequestInit](interfaces/FsRequestInit.md) | fetch-t options for download and upload. |
| [ReadOptions](interfaces/ReadOptions.md) | Options for reading files with specified encoding. |
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
| [NOT\_FOUND\_ERROR](variables/NOT_FOUND_ERROR.md) | A constant representing the error thrown when a file or directory is not found. Name of DOMException.NOT_FOUND_ERR. |

## Functions

| Function | Description |
| ------ | ------ |
| [appendFile](functions/appendFile.md) | Appends content to a file at the specified path. |
| [assertAbsolutePath](functions/assertAbsolutePath.md) | Asserts that the provided path is an absolute path. |
| [assertFileUrl](functions/assertFileUrl.md) | Asserts that the provided URL is a valid file URL. |
| [downloadFile](functions/downloadFile.md) | Downloads a file from a URL and saves it to the specified path. |
| [emptyDir](functions/emptyDir.md) | Empties the contents of a directory at the specified path. |
| [exists](functions/exists.md) | Checks whether a file or directory exists at the specified path. |
| [isCurrentDir](functions/isCurrentDir.md) | Checks if the provided directory path is the current directory. |
| [isOPFSSupported](functions/isOPFSSupported.md) | Checks if the Origin Private File System (OPFS) is supported in the current environment. |
| [isRootPath](functions/isRootPath.md) | Checks if the provided path is the root directory path. |
| [mkdir](functions/mkdir.md) | Creates a new directory at the specified path same as `mkdir -p`. |
| [readBlobFile](functions/readBlobFile.md) | Reads the content of a file at the specified path as a Blob. |
| [readDir](functions/readDir.md) | Reads the contents of a directory at the specified path. |
| [readFile](functions/readFile.md) | Reads the content of a file at the specified path as an ArrayBuffer. |
| [readTextFile](functions/readTextFile.md) | Reads the content of a file at the specified path as a string. |
| [remove](functions/remove.md) | Removes a file or directory at the specified path same as `rm -rf`. |
| [rename](functions/rename.md) | Renames a file or directory from an old path to a new path. |
| [stat](functions/stat.md) | Retrieves the status of a file or directory at the specified path. |
| [uploadFile](functions/uploadFile.md) | Uploads a file from the specified path to a URL. |
| [writeFile](functions/writeFile.md) | Writes content to a file at the specified path. |
