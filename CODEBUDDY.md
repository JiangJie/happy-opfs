# CODEBUDDY.md

This file provides guidance to CodeBuddy Code when working with code in this repository.

## Project Overview

happy-opfs is a browser-compatible file system module based on OPFS (Origin Private File System) that provides a Deno-style API for file operations. The project uses TypeScript and targets ESNext with strict type checking.

**License:** MIT

**Key Dependencies:**
- `@std/path` from JSR - **Important:** Requires `.npmrc` configuration with `@jsr:registry=https://npm.jsr.io`
- `happy-rusty` - Provides Rust-style `Result<T, E>` types for error handling
- `fflate` - For zip/unzip operations (uses `fflate/browser` for browser-optimized build)
- `@happy-ts/fetch-t` - For download/upload operations
- `tiny-future` - For Promise-based future/deferred patterns
- `tiny-invariant` - For runtime assertions

## Development Commands

### Package Manager
This project uses **pnpm** as the package manager.

### Common Commands
```bash
# Install dependencies
pnpm install

# Type checking
pnpm run check

# Linting
pnpm run lint

# Build (runs prebuild: check types, lint)
pnpm run build

# Generate documentation
pnpm run docs

# Run examples (opens https://localhost:5173)
pnpm run eg
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
- Uses MSW (Mock Service Worker) for download/upload API mocking

**Worker helper files for tests:**
- `tests/worker.ts` - Main worker for sync API tests
- `tests/worker-check-connected.ts` - Worker for connection checking tests
- `tests/worker-connect-error.ts` - Worker for connection error tests

### Mock Server (MSW)
Download and upload tests use MSW instead of external APIs:
- Handlers defined in `tests/mocks/handlers.ts`
- Browser setup in `tests/mocks/browser.ts`
- Service worker is auto-generated via `pretest` script (runs `msw init`)
- Mock endpoints use `https://mock.test` domain

## Code Architecture

### Module Structure

```
src/
├── mod.ts                      # Main entry point, exports all public APIs
├── fs/                         # OPFS file system operations
│   ├── core/                  # Core OPFS operations (createFile, mkdir, readFile, writeFile, etc.)
│   ├── opfs_ext.ts            # Extended operations (copy, move, exists, emptyDir, etc.)
│   ├── opfs_tmp.ts            # Temporary file operations (mkTemp, deleteTemp, pruneTemp)
│   ├── opfs_zip.ts            # Zip operations
│   ├── opfs_unzip.ts          # Unzip operations
│   ├── opfs_download.ts       # File download operations
│   ├── opfs_upload.ts         # File upload operations
│   ├── helpers.ts             # Internal helper functions for handle management
│   ├── guards.ts              # Type guard functions (isAbsolutePath, etc.)
│   ├── assertions.ts          # Path and URL validation assertions
│   ├── constants.ts           # Constants (ROOT_DIR, TMP_DIR, error names)
│   ├── defines.ts             # TypeScript type definitions
│   ├── codec.ts               # Text encoding/decoding utilities (cached TextEncoder/TextDecoder)
│   ├── url.ts                 # URL utilities (getUrlPathname, etc.) - @internal
│   └── support.ts             # OPFS feature detection
└── worker/                     # Synchronous API implementation via Web Workers
    ├── opfs_worker.ts         # Worker-side: Listens for requests, executes async operations
    ├── opfs_worker_adapter.ts # Main thread-side: Sends requests to worker, provides sync APIs
    ├── shared.ts              # Shared communication protocol (SyncMessenger, lock mechanism)
    └── defines.ts             # Worker-specific type definitions (FileLike, ErrorLike)
```

### Key Architectural Patterns

#### 1. Result Type Pattern
All async operations return `AsyncIOResult<T>` or `AsyncVoidIOResult` (from `happy-rusty`):
```typescript
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
  - **Check connection:** Use `isSyncAgentConnected()` to check if sync agent is connected
  - **Share messenger:** Use `getSyncMessenger()` / `setSyncMessenger()` to share sync instance between contexts (e.g., iframes)

#### 3. Path Handling
- All paths are normalized to POSIX format using `@std/path/posix`
- Paths must be absolute (start with `/`)
- Root directory: `/`
- Temporary directory: `/tmp`
- Path validation via `assertAbsolutePath()` in `assertions.ts`

#### 4. URL Parameter Support
Functions accepting URL parameters (`downloadFile`, `uploadFile`, `zipFromUrl`, `unzipFromUrl`) support both:
- `string` - URL as string
- `URL` - URL object

URL validation uses `URL.canParse()` with fallback to `new URL()` for older browsers.

#### 5. Handle-based File System
- Internal implementation uses FileSystemHandle hierarchy
- Helper functions in `helpers.ts` manage handle retrieval and traversal
- Public API uses path strings, internal code uses handles

#### 6. Worker Communication Protocol
Located in `src/worker/shared.ts`:
- Uses SharedArrayBuffer with Int32Array for lock-based communication
- Atomics.wait/notify for synchronization
- JSON serialization for data transfer
- `SyncMessenger` class encapsulates buffer operations:
  - `i32a` (public): Int32Array for atomic lock operations
  - `maxDataLength` (public): Maximum payload size
  - `setPayload()` / `getPayload()`: Methods to write/read payload data
  - `HEADER_LENGTH` (private static): Fixed header size (16 bytes)

### Important Implementation Details

#### Type Assertions for Uint8Array
When passing Uint8Array data to writeFile operations, explicit type assertions may be needed:
```typescript
await writeFile(path, data as Uint8Array<ArrayBuffer>);
```

#### Error Constants
Common error constants exported from `src/fs/constants.ts`:
- `NOT_FOUND_ERROR` - File/directory not found (DOMException name)
- `ROOT_DIR` - Root directory path (`/`)
- `TMP_DIR` - Temporary directory path (`/tmp`)
- `ABORT_ERROR`, `TIMEOUT_ERROR` - Re-exported from `@happy-ts/fetch-t`

### Build Configuration

- **Vite** (vite.config.ts): Builds library with CJS and ESM outputs
  - Input: `src/mod.ts`
  - Outputs: `dist/main.cjs`, `dist/main.mjs`
  - `copyPublicDir: false` to prevent test files in dist

- **Rollup** (rollup.config.ts): Generates bundled type declarations
  - Uses `rollup-plugin-dts` for `.d.ts` bundling
  - Output: `dist/types.d.ts`

- **Vitest** (configured in vite.config.ts): Browser-based testing
  - Uses Playwright Chromium in headless mode
  - Coverage via v8 provider
  - Tests run sequentially for OPFS isolation

- **ESLint** (eslint.config.mjs): Uses `@eslint/js` + `typescript-eslint`
  - Extends: recommended, strict, and stylistic configs

- **TypeScript** (tsconfig.json): Strict mode enabled
  - Module: ESNext with bundler resolution
  - Strict flags: noUnusedLocals, noUnusedParameters, noPropertyAccessFromIndexSignature

## Commit Conventions

This project uses Conventional Commits:
- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `test:` - Test changes
- `chore:` - Maintenance tasks
- `refactor:` - Code refactoring

## Important Notes

1. **JSR Dependency:** Always ensure `.npmrc` contains `@jsr:registry=https://npm.jsr.io` before installing dependencies

2. **Browser Environment:** This is a browser-only library. All code assumes browser globals (navigator, Worker, SharedArrayBuffer)

3. **OPFS Limitations:**
   - Only works in secure contexts (HTTPS or localhost)
   - Data is origin-scoped and private
   - Sync APIs require SharedArrayBuffer (needs COOP/COEP headers)

4. **Error Handling:** Never use try-catch with async operations. Always use `.isOk()` / `.isErr()` on Result types

5. **Error Messages:** Error messages should NOT end with a period (following industry conventions)

6. **Testing:** Use OPFS Explorer browser extension to visually inspect file system state during development

7. **Test Coverage Limitations:**
   - `src/worker/opfs_worker.ts` is excluded from coverage (runs in Worker thread, V8 cannot instrument)
   - `src/fs/core/*.ts` has uncovered branches that run in Worker context (tested via sync API)
   - `src/mod.ts` and `src/fs/defines.ts` are excluded (re-exports and type definitions only)

## Examples

The `examples/` directory contains runnable examples for all major features:

- `basic.ts` - File/directory CRUD operations
- `download-upload.ts` - File download and upload with progress
- `stream.ts` - Readable/writable stream operations
- `zip.ts` - Zip/unzip operations
- `sync-api.ts` + `sync-worker.ts` - Synchronous file operations via Web Worker
- `shared-messenger.ts` + `shared-messenger-child.ts` - Sharing sync instance between iframe contexts

Run examples with `pnpm eg` (requires HTTPS, Vite dev server handles this automatically).
