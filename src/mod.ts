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
 * -
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
 * (await readFile('/data/config.json', { encoding: 'utf8' }))
 *     .inspect(content => console.log(content));
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
 * (await readFile('/path/to/file'))
 *     .inspect(content => {
 *         // Handle success
 *         console.log(content);
 *     })
 *     .inspectErr(error => {
 *         // Handle error
 *         console.error(error.message);
 *     });
 * ```
 *
 * @packageDocumentation
 */

export * from './fs/mod.ts';
export * from './worker/mod.ts';
