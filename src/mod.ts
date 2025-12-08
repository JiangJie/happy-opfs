/**
 * @module happy-opfs
 *
 * A browser-compatible file system module based on Origin Private File System (OPFS).
 * Provides a Deno-style async API and optional sync API via Web Workers.
 *
 * ## Features
 *
 * - **Async API**: Direct OPFS operations returning `Result<T, E>` types
 * - **Sync API**: Optional synchronous operations via Worker communication
 * - **Path Operations**: Full directory/file manipulation (create, read, write, delete, copy, move)
 * - **Utilities**: Temporary files, zipping, downloading, uploading
 * - **Type Safety**: Full TypeScript support with strict type checking
 *
 * ## Quick Start
 *
 * ### Async API (Recommended)
 *
 * ```typescript
 * import { readFile, writeFile, mkdir } from 'happy-opfs';
 *
 * // Write a file
 * await writeFile('/data/config.json', JSON.stringify({ key: 'value' }));
 *
 * // Read a file
 * const result = await readFile('/data/config.json', { encoding: 'utf8' });
 * if (result.isOk()) {
 *     console.log(result.unwrap());
 * }
 * ```
 *
 * ### Sync API (Optional)
 *
 * Requires Worker setup:
 *
 * ```typescript
 * // main.js
 * import { connectSyncAgent, readFileSync } from 'happy-opfs';
 *
 * await connectSyncAgent({
 *     worker: new URL('./worker.js', import.meta.url),
 * });
 *
 * const result = readFileSync('/data/config.json', { encoding: 'utf8' });
 * ```
 *
 * ```typescript
 * // worker.js
 * import { startSyncAgent } from 'happy-opfs';
 * startSyncAgent();
 * ```
 *
 * ## Error Handling
 *
 * All operations return `Result` types from `happy-rusty`:
 *
 * ```typescript
 * const result = await readFile('/path/to/file');
 * if (result.isOk()) {
 *     const content = result.unwrap();
 * } else {
 *     const error = result.unwrapErr();
 *     console.error(error.message);
 * }
 * ```
 *
 * @packageDocumentation
 */

// Assertions and validations
export * from './fs/assertions.ts';

// Constants
export * from './fs/constants.ts';

// Type definitions
export * from './fs/defines.ts';

// Core file system operations: createFile, mkdir, readDir, readFile, writeFile, remove, stat
export * from './fs/opfs_core.ts';

// Download operations: downloadFile
export * from './fs/opfs_download.ts';

// Extended operations: copy, move, exists, emptyDir, appendFile, readTextFile, readJsonFile, etc.
export * from './fs/opfs_ext.ts';

// Temporary file operations: mkTemp, deleteTemp, pruneTemp
export * from './fs/opfs_tmp.ts';

// Unzip operations: unzip, unzipFromUrl
export * from './fs/opfs_unzip.ts';

// Upload operations: uploadFile
export * from './fs/opfs_upload.ts';

// Zip operations: zip, zipFromUrl
export * from './fs/opfs_zip.ts';

// Browser support detection
export * from './fs/support.ts';

// Utility functions and type guards
export * from './fs/utils.ts';

// Worker sync agent (for worker thread)
export * from './worker/opfs_worker.ts';

// Worker adapter and sync API functions (for main thread)
export * from './worker/opfs_worker_adapter.ts';

// Sync messenger type for cross-context sharing
export type { SyncMessenger } from './worker/shared.ts';
