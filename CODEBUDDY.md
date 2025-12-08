# CODEBUDDY.md

This file provides guidance to CodeBuddy Code when working with code in this repository.

## Project Overview

happy-opfs is a browser-compatible file system module based on OPFS (Origin Private File System) that provides a Deno-style API for file operations. The project uses TypeScript and targets ESNext with strict type checking.

**Key Dependencies:**
- `@std/path` from JSR - **Important:** Requires `.npmrc` configuration with `@jsr:registry=https://npm.jsr.io`
- `happy-rusty` - Provides Rust-style `Result<T, E>` types for error handling
- `fflate` - For zip/unzip operations
- `@happy-ts/fetch-t` - For download/upload operations
- `tiny-future` - For Promise-based future/deferred patterns

## Development Commands

### Package Manager
This project uses **pnpm** as the package manager.

### Common Commands
```bash
# Install dependencies
pnpm install

# Type checking
pnpm run check
# Equivalent to: pnpm exec tsc --noEmit

# Linting
pnpm run lint
# Equivalent to: pnpm exec eslint .

# Build (runs prebuild: check types, lint)
pnpm run build
# Equivalent to: pnpm exec vite build

# Generate documentation
pnpm run docs
# Equivalent to: pnpm exec typedoc
```

### Testing
Tests use **Vitest** with **Playwright** browser automation.

```bash
# Install Playwright browsers (first time setup)
pnpm run playwright:install

# Run all tests
pnpm test

# Run tests in watch mode
pnpm run test:watch

# Run tests with UI
pnpm run test:ui

# Run a specific test file
pnpm exec vitest run tests/core.test.ts

# Run tests matching a pattern
pnpm exec vitest run -t "readFile"
```

Tests are located in `tests/` directory. The test environment:
- Uses Playwright's Chromium browser in headless mode
- Automatically configures HTTPS and required COOP/COEP headers
- Runs tests sequentially to avoid OPFS conflicts
- Coverage reports via v8 provider

## Code Architecture

### Module Structure

```
src/
├── mod.ts                      # Main entry point, exports all public APIs
├── fs/                         # Core file system operations
│   ├── opfs_core.ts           # Core OPFS operations (createFile, mkdir, readFile, writeFile, etc.)
│   ├── opfs_ext.ts            # Extended operations (copy, move, exists, emptyDir, etc.)
│   ├── opfs_tmp.ts            # Temporary file operations (mkTemp, deleteTemp, pruneTemp)
│   ├── opfs_zip.ts            # Zip operations
│   ├── opfs_unzip.ts          # Unzip operations
│   ├── opfs_download.ts       # File download operations
│   ├── opfs_upload.ts         # File upload operations
│   ├── helpers.ts             # Internal helper functions for handle management
│   ├── utils.ts               # Utility functions (path normalization, type guards)
│   ├── assertions.ts          # Path validation assertions
│   ├── constants.ts           # Constants (ROOT_DIR, TMP_DIR, error names)
│   ├── defines.ts             # TypeScript type definitions
│   ├── codec.ts               # Text encoding/decoding utilities (cached TextEncoder/TextDecoder)
│   └── support.ts             # OPFS feature detection
└── worker/                     # Synchronous API implementation via Web Workers
    ├── opfs_worker.ts         # Worker-side: Listens for requests, executes async operations
    ├── opfs_worker_adapter.ts # Main thread-side: Sends requests to worker, provides sync APIs
    ├── shared.ts              # Shared communication protocol (SyncMessenger, lock mechanism)
    └── helpers.ts             # Serialization helpers for Worker communication
```

### Key Architectural Patterns

#### 1. Result Type Pattern
All async operations return `AsyncIOResult<T>` or `AsyncVoidIOResult` (from `happy-rusty`):
```typescript
// Success: Ok(value)
// Error: Err(error)
const result = await readFile('/path/to/file');
if (result.isOk()) {
  const content = result.unwrap();
} else {
  const error = result.unwrapErr();
}
```

#### 2. Dual API Design (Async + Sync)
- **Async APIs** (in `src/fs/`): Direct OPFS operations, recommended for use
- **Sync APIs** (in `src/worker/`): Implemented via Worker communication using SharedArrayBuffer
  - Main thread calls sync function → blocks and waits
  - Worker thread executes async OPFS operation
  - Result is passed back via SharedArrayBuffer
  - **Usage:** Call `connectSyncAgent()` in main thread, `startSyncAgent()` in worker

#### 3. Path Handling
- All paths are normalized to POSIX format using `@std/path/posix`
- Paths must be absolute (start with `/`)
- Root directory: `/`
- Temporary directory: `/tmp`
- Path validation via `assertAbsolutePath()` in `assertions.ts`

#### 4. Handle-based File System
- Internal implementation uses FileSystemHandle hierarchy:
  - `FileSystemDirectoryHandle` for directories
  - `FileSystemFileHandle` for files
- Helper functions in `helpers.ts` manage handle retrieval and traversal
- Public API uses path strings, internal code uses handles

#### 5. Worker Communication Protocol
Located in `src/worker/shared.ts`:
- Uses SharedArrayBuffer with Int32Array for lock-based communication
- Lock indices: MAIN_LOCK_INDEX (0), WORKER_LOCK_INDEX (1), DATA_INDEX (2)
- Lock values: MAIN_LOCKED (1), MAIN_UNLOCKED (0), WORKER_UNLOCKED (1)
- Atomics.wait/notify for synchronization
- JSON serialization via `encodeToBuffer`/`decodeFromBuffer` for data transfer

**Buffer Layout:**
```
Offset  Size    Field           Description
0       4       MAIN_LOCK       Main thread state (0=unlocked, 1=locked/waiting)
4       4       WORKER_LOCK     Worker thread state
8       4       DATA_LENGTH     Length of payload data in bytes
12      4       RESERVED        Reserved for future use
16+     var     PAYLOAD         Actual request/response binary data
```

### Important Implementation Details

#### File Operations Flow
1. Path validation (assertions)
2. Get root handle via `navigator.storage.getDirectory()`
3. Traverse path to get target handle (via `helpers.ts`)
4. Perform operation on handle
5. Wrap result in Result type

#### Sync Operation Flow
1. Main thread: Encode operation + args → Call `callWorkerFromMain()` → Block on Atomics.wait
2. Worker thread: Decode operation + args → Execute async OPFS operation → Encode result → Notify main thread
3. Main thread: Wake up → Decode result → Return Result type

#### Type Assertions for Uint8Array
When passing Uint8Array data to writeFile operations, explicit type assertions may be needed:
```typescript
await writeFile(path, data as Uint8Array<ArrayBuffer>);
```

#### Error Constants
Common error constants exported from `src/fs/constants.ts`:
- `NOT_FOUND_ERROR` - File/directory not found (DOMException name)
- `NO_STRATEGY_ERROR` - No viable strategy for operation
- `ROOT_DIR` - Root directory path (`/`)
- `TMP_DIR` - Temporary directory path (`/tmp`)
- `ABORT_ERROR`, `TIMEOUT_ERROR` - Re-exported from `@happy-ts/fetch-t`

### Build Configuration

- **Vite** (vite.config.ts): Builds library with CJS and ESM outputs
  - Input: `src/mod.ts`
  - Outputs: `dist/main.cjs`, `dist/main.mjs`, `dist/types.d.ts`
  - Uses `vite-plugin-dts` for type declarations
  - External dependencies: `@std/path`, `happy-rusty`, `tiny-invariant`, `@happy-ts/fetch-t`, `tiny-future`, `fflate/browser`

- **Vitest** (configured in vite.config.ts): Browser-based testing
  - Uses Playwright Chromium in headless mode
  - Coverage via v8 provider
  - Tests run sequentially for OPFS isolation
  
- **TypeDoc** (typedoc.json): Generates markdown documentation
  - Plugin: `typedoc-plugin-markdown`
  - Output: `docs/`

- **ESLint** (eslint.config.mjs): Uses `@eslint/js` + `typescript-eslint`
  - Config format: Modern `defineConfig` with `globalIgnores`
  - Extends: recommended, strict, and stylistic configs

- **TypeScript** (tsconfig.json): Strict mode enabled
  - Module: ESNext with bundler resolution
  - No emit (type checking only)
  - Strict flags: noUnusedLocals, noUnusedParameters, noPropertyAccessFromIndexSignature

## Commit Conventions

This project uses Conventional Commits:
- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `chore:` - Maintenance tasks
- `refactor:` - Code refactoring
- `chore(deps):` - Dependency updates

## Important Notes

1. **JSR Dependency:** Always ensure `.npmrc` contains `@jsr:registry=https://npm.jsr.io` before installing dependencies

2. **Browser Environment:** This is a browser-only library. All code assumes browser globals (navigator, Worker, SharedArrayBuffer)

3. **OPFS Limitations:** 
   - Only works in secure contexts (HTTPS or localhost)
   - Data is origin-scoped and private
   - Sync APIs require SharedArrayBuffer (needs COOP/COEP headers)

4. **Error Handling:** Never use try-catch with async operations. Always use `.isOk()` / `.isErr()` on Result types

5. **Testing:** Use OPFS Explorer browser extension to visually inspect file system state during development

6. **Test Coverage Limitations:**
   - `src/worker/opfs_worker.ts` is excluded from coverage (runs in Worker thread, V8 cannot instrument)
   - `src/fs/opfs_core.ts` has uncovered branches that run in Worker context (tested via sync API)
   - `src/mod.ts` and `src/fs/defines.ts` are excluded (re-exports and type definitions only)
