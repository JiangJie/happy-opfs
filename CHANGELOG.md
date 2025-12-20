# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.11.0] - 2025-12-20

### Added

- `isSyncAgentConnected()` API to check if sync agent is connected
- URL type parameter support for `downloadFile`, `uploadFile`, `zipFromUrl`, `unzipFromUrl`
- Runnable examples in `examples/` directory for all major features

### Changed

- **License changed from GPL-3.0 to MIT**
- Refactor `SyncMessenger` class to encapsulate internals (`HEADER_LENGTH` as private static, `u8a` as private with `setPayload`/`getPayload` methods)
- Simplify README with concise feature table and quick start examples
- Update documentation with new APIs and architectural details
- Change examples script from `pnpm examples` to `pnpm eg`

### Fixed

- Improve URL validation with `URL.canParse()` fallback for older browsers

## [1.10.0] - 2025-12-08

### Added

- MSW (Mock Service Worker) for download/upload API testing
- Comprehensive tests for `writeFile` function
- Edge case tests for worker adapter coverage
- Test coverage and browser compatibility sections to README

### Changed

- Replace external API with MSW mock server in tests
- Refactor: extract text codec to separate module
- Switch from Rollup to Vite for building
- Improve JSDoc comments and module documentation

### Fixed

- Correctly handle partial writes in synchronous fallback
- Configure fixed port for MSW service worker in CI
- Add Chromium args to ignore SSL certificate errors in CI

## [1.9.0] - 2025-11-27

### Added

- Imports mapping to jsr.json for JSR compatibility
- CODEBUDDY.md for development guidance
- JSR registry configuration instructions

### Changed

- Modernize ESLint configuration
- Update typedoc configuration
- Upgrade @happy-ts/fetch-t to v1.3.3

### Fixed

- Add explicit type assertions for Uint8Array in zip operations

## [1.8.7] - 2025-07-31

### Changed

- Upgrade dependencies

## [1.8.6] - 2025-05-06

### Fixed

- Modify the `setSyncMessenger` verification conditions

## [1.8.5] - 2025-05-06

### Added

- `getSyncMessenger()` and `setSyncMessenger()` methods for sharing sync instance between contexts (e.g., iframes)

## [1.8.4] - 2024-08-13

### Added

- `readJsonFile()` and `readJsonFileSync()` methods

## [1.8.3] - 2024-08-13

### Fixed

- `zip` and `unzip` cannot be abortable when fetch from URL
- Use a unified `createAbortError` method

## [1.8.2] - 2024-08-12

### Added

- `move` now supports directories

### Fixed

- Should always create a new directory when `copy` directories
- Reduce duplication of code in copy/move operations

## [1.8.1] - 2024-08-11

### Changed

- Update README

## [1.8.0] - 2024-08-11

### Changed

- Rename `rename` to `move`
- Rewrite the code using the flow control of `Result`

## [1.7.4] - 2024-08-09

### Changed

- `downloadFile` will preserve the extension of the saved temporary file

## [1.7.3] - 2024-08-09

### Changed

- Rename `filePath` to `tempFilePath` in download options

## [1.7.2] - 2024-08-09

### Added

- `downloadFile` supports saving downloaded files to a temporary path
- `isTempPath()` method to check if a path is in temp directory

## [1.7.0] - 2024-08-08

### Added

- `copy()` and `copySync()` methods
- `pruneTemp()` and `pruneTempSync()` to delete expired temporary files
- `deleteTemp()` and `deleteTempSync()` methods
- `mkTempSync()` method
- `createFile()` and `createFileSync()` methods
- `zipFromUrl()` support
- `unzipFromUrl()` support
- `zip` to memory support
- `onProgress` callback for download and upload operations

### Fixed

- Parameters passed to the worker are not serialized causing some synchronization interfaces to fail
- `zipSync` failure

## [1.6.1] - 2024-08-06

### Changed

- Optimize the creation time of `Future`

## [1.6.0] - 2024-08-06

### Added

- `zip()` and `zipSync()` methods
- `unzip()` and `unzipSync()` methods
- `fflate` dependency for zip/unzip support

### Changed

- Use `ROOT_DIR` constant to replace hardcoded '/'
- Export more utility methods

## [1.5.0] - 2024-08-05

### Changed

- Some methods now return `VoidIOResult` instead of `IOResult<void>`

## [1.4.2] - 2024-08-04

### Changed

- Update dependencies

## [1.4.1] - 2024-08-03

### Changed

- Update documentation

## [1.4.0] - 2024-08-03

### Added

- `readFileSync` now supports `encoding` option

### Changed

- `readBlobFile` now returns `File` type instead of `Blob`
- Remove dependency `json-joy`

## [1.3.3] - 2024-08-03

### Changed

- Update fetch-t dependency

## [1.3.2] - 2024-08-03

### Changed

- Optimize `emptyDir` implementation
- Use `Result.map` for better code flow
- Reduce unnecessary exports

## [1.3.1] - 2024-08-02

### Changed

- Remove redundant error handling code
- Make `aborted` property readonly

## [1.3.0] - 2024-08-02

### Added

- Sync API now returns more FileSystemHandle properties

## [1.2.1] - 2024-08-02

### Changed

- Use `RESULT_TRUE` and `RESULT_FALSE` constants

## [1.2.0] - 2024-08-02

### Changed

- Reorganize the code structure

## [1.1.0] - 2024-08-01

### Added

- Synchronous I/O support via Web Worker (`connectSyncAgent`, `startSyncAgent`)
- `mkdirSync`, `readFileSync`, `writeFileSync`, `removeSync`, `statSync`, `readDirSync`, `existsSync`, `appendFileSync`, `readTextFileSync`, `readBlobFileSync`, `emptyDirSync`

### Fixed

- `Atomics.notify` may not work in some cases
- Worker error handling
- Path errors in `readDir` return values

## [1.0.21] - 2024-07-29

### Changed

- Not found is treated as success when `remove`

## [1.0.20] - 2024-07-29

### Fixed

- `emptyDir` should join children path correctly
- Format DOMException error message

### Changed

- Export `NOT_FOUND_ERROR` as const

## [1.0.19] - 2024-07-28

### Fixed

- `readDir` should return relative path

### Changed

- Return DOMException when `getChildHandle` fails

## [1.0.18] - 2024-07-28

### Added

- `readDir` now supports `recursive` option

## [1.0.17] - 2024-07-25

### Changed

- Use FormData as upload body

## [1.0.16] - 2024-07-25

### Changed

- Update fetch-t to v1.0.15

## [1.0.15] - 2024-07-24

### Changed

- Update fetch-t to v1.0.14

## [1.0.14] - 2024-07-24

### Added

- `downloadFile` and `uploadFile` now support timeout and abort options

### Changed

- Use fetch-t instead of native fetch

## [1.0.13] - 2024-07-24

### Changed

- `downloadFile` and `uploadFile` now return fetch Response

## [1.0.12] - 2024-07-17

### Changed

- Use `asErr` for type conversion

## [1.0.11] - 2024-07-13

### Changed

- Update documentation and dependencies

## [1.0.10] - 2024-06-11

### Changed

- Remove `assertAbsolutePath` for `emptyDir`
- Update examples and tests

## [1.0.9] - 2024-05-16

### Added

- `emptyDir` API to empty or create a directory

### Changed

- Use output type alias for better code readability

## [1.0.8] - 2024-05-14

### Changed

- Better `readFile` overloads annotation
- Reorder `readFile` overloads
- Switch from npm to pnpm

## [1.0.7] - 2024-05-08

### Changed

- Use `AsyncIOResult` to replace `FsAsyncResult`
- Change enum `FileEncoding` to union type

## [1.0.6] - 2024-05-06

### Added

- `uploadFile` API

## [1.0.5] - 2024-05-06

### Added

- Export `NOT_FOUND_ERROR` constant

## [1.0.4] - 2024-05-06

### Added

- `downloadFile` API

## [1.0.3] - 2024-05-04

### Changed

- Replace Parcel build with Rollup
- Add config intellisense for CJS

## [1.0.2] - 2024-05-02

### Added

- `FsAsyncResult` type stands for `Promise<Result<T, Error>>`

## [1.0.1] - 2024-05-02

### Added

- Export more APIs and types
- GitHub Actions workflows

### Changed

- Run check and lint before build
- Cache fsRoot after first get

## [1.0.0] - 2024-04-29

### Added

- Initial release
- Core file system operations: `mkdir`, `readDir`, `readFile`, `writeFile`, `remove`, `stat`
- Extended operations: `appendFile`, `exists`, `readTextFile`, `readBlobFile`
- Stream operations: `readFileStream`, `writeFileStream`
- Deno-style API design
- Result type pattern for error handling
- OPFS feature detection with `isOPFSSupported()`

[1.11.0]: https://github.com/JiangJie/happy-opfs/compare/v1.10.0...HEAD
[1.10.0]: https://github.com/JiangJie/happy-opfs/compare/v1.9.0...v1.10.0
[1.9.0]: https://github.com/JiangJie/happy-opfs/compare/v1.8.7...v1.9.0
[1.8.7]: https://github.com/JiangJie/happy-opfs/compare/v1.8.6...v1.8.7
[1.8.6]: https://github.com/JiangJie/happy-opfs/compare/v1.8.5...v1.8.6
[1.8.5]: https://github.com/JiangJie/happy-opfs/compare/v1.8.4...v1.8.5
[1.8.4]: https://github.com/JiangJie/happy-opfs/compare/v1.8.3...v1.8.4
[1.8.3]: https://github.com/JiangJie/happy-opfs/compare/v1.8.2...v1.8.3
[1.8.2]: https://github.com/JiangJie/happy-opfs/compare/v1.8.1...v1.8.2
[1.8.1]: https://github.com/JiangJie/happy-opfs/compare/v1.8.0...v1.8.1
[1.8.0]: https://github.com/JiangJie/happy-opfs/compare/v1.7.4...v1.8.0
[1.7.4]: https://github.com/JiangJie/happy-opfs/compare/v1.7.3...v1.7.4
[1.7.3]: https://github.com/JiangJie/happy-opfs/compare/v1.7.2...v1.7.3
[1.7.2]: https://github.com/JiangJie/happy-opfs/compare/v1.7.0...v1.7.2
[1.7.0]: https://github.com/JiangJie/happy-opfs/compare/v1.6.1...v1.7.0
[1.6.1]: https://github.com/JiangJie/happy-opfs/compare/v1.6.0...v1.6.1
[1.6.0]: https://github.com/JiangJie/happy-opfs/compare/v1.5.0...v1.6.0
[1.5.0]: https://github.com/JiangJie/happy-opfs/compare/v1.4.2...v1.5.0
[1.4.2]: https://github.com/JiangJie/happy-opfs/compare/v1.4.1...v1.4.2
[1.4.1]: https://github.com/JiangJie/happy-opfs/compare/v1.4.0...v1.4.1
[1.4.0]: https://github.com/JiangJie/happy-opfs/compare/v1.3.3...v1.4.0
[1.3.3]: https://github.com/JiangJie/happy-opfs/compare/v1.3.2...v1.3.3
[1.3.2]: https://github.com/JiangJie/happy-opfs/compare/v1.3.1...v1.3.2
[1.3.1]: https://github.com/JiangJie/happy-opfs/compare/v1.3.0...v1.3.1
[1.3.0]: https://github.com/JiangJie/happy-opfs/compare/v1.2.1...v1.3.0
[1.2.1]: https://github.com/JiangJie/happy-opfs/compare/v1.2.0...v1.2.1
[1.2.0]: https://github.com/JiangJie/happy-opfs/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/JiangJie/happy-opfs/compare/v1.0.21...v1.1.0
[1.0.21]: https://github.com/JiangJie/happy-opfs/compare/v1.0.20...v1.0.21
[1.0.20]: https://github.com/JiangJie/happy-opfs/compare/v1.0.19...v1.0.20
[1.0.19]: https://github.com/JiangJie/happy-opfs/compare/v1.0.18...v1.0.19
[1.0.18]: https://github.com/JiangJie/happy-opfs/compare/v1.0.17...v1.0.18
[1.0.17]: https://github.com/JiangJie/happy-opfs/compare/v1.0.16...v1.0.17
[1.0.16]: https://github.com/JiangJie/happy-opfs/compare/v1.0.15...v1.0.16
[1.0.15]: https://github.com/JiangJie/happy-opfs/compare/v1.0.14...v1.0.15
[1.0.14]: https://github.com/JiangJie/happy-opfs/compare/v1.0.13...v1.0.14
[1.0.13]: https://github.com/JiangJie/happy-opfs/compare/v1.0.12...v1.0.13
[1.0.12]: https://github.com/JiangJie/happy-opfs/compare/v1.0.11...v1.0.12
[1.0.11]: https://github.com/JiangJie/happy-opfs/compare/v1.0.10...v1.0.11
[1.0.10]: https://github.com/JiangJie/happy-opfs/compare/v1.0.9...v1.0.10
[1.0.9]: https://github.com/JiangJie/happy-opfs/compare/v1.0.8...v1.0.9
[1.0.8]: https://github.com/JiangJie/happy-opfs/compare/v1.0.7...v1.0.8
[1.0.7]: https://github.com/JiangJie/happy-opfs/compare/v1.0.6...v1.0.7
[1.0.6]: https://github.com/JiangJie/happy-opfs/compare/v1.0.5...v1.0.6
[1.0.5]: https://github.com/JiangJie/happy-opfs/compare/v1.0.4...v1.0.5
[1.0.4]: https://github.com/JiangJie/happy-opfs/compare/v1.0.3...v1.0.4
[1.0.3]: https://github.com/JiangJie/happy-opfs/compare/v1.0.2...v1.0.3
[1.0.2]: https://github.com/JiangJie/happy-opfs/compare/v1.0.1...v1.0.2
[1.0.1]: https://github.com/JiangJie/happy-opfs/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/JiangJie/happy-opfs/releases/tag/v1.0.0
