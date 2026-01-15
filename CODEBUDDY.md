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
- `tests/worker-async-api.ts` - Worker for async API tests

### Mock Server (MSW)
Download and upload tests use MSW instead of external APIs:
- Handlers defined in `tests/mocks/handlers.ts`
- Browser setup in `tests/mocks/browser.ts`
- Service worker is auto-generated via `pretest` script (runs `msw init`)
- Mock endpoints use `https://mock.test` domain

### Code Architecture

#### Module Organization

The project organizes code into three main layers based on execution context and visibility:

```
src/
├── mod.ts                      # Main entry point, exports all public APIs
│
├── shared/                     # Shared utilities (thread-agnostic)
│   ├── mod.ts                 # Aggregates shared modules
│   ├── codec.ts               # Text encoding/decoding with cached encoders
│   ├── constants.ts           # Application-wide constants
│   ├── defines.ts             # Shared TypeScript type definitions
│   ├── guards.ts              # Type guard functions (isAbsolutePath, etc.)
│   ├── helpers.ts             # Shared helper functions
│   └── support.ts             # OPFS feature detection
│
├── async/                      # Async OPFS operations (main thread)
│   ├── mod.ts                 # Aggregates all async modules
│   ├── core/                  # Core OPFS operations
│   │   ├── mod.ts             # Aggregates core modules
│   │   ├── create.ts          # File/directory creation
│   │   ├── read.ts            # File reading operations
│   │   ├── write.ts           # File writing operations
│   │   ├── remove.ts          # File/directory removal
│   │   └── stat.ts            # File/directory metadata
│   ├── archive/               # Archive operations
│   │   ├── mod.ts             # Aggregates archive modules
│   │   ├── helpers.ts         # Archive helper functions
│   │   ├── zip.ts             # Zip operations
│   │   ├── unzip.ts           # Unzip operations
│   │   ├── zip-stream.ts      # Streaming zip operations
│   │   └── unzip-stream.ts    # Streaming unzip operations
│   ├── transfer/              # File transfer operations
│   │   ├── mod.ts             # Aggregates transfer modules
│   │   ├── download.ts        # Download from URL
│   │   └── upload.ts          # Upload to URL
│   ├── internal/              # Internal utilities (@internal tagged)
│   │   ├── mod.ts             # Aggregates internal modules
│   │   ├── validations.ts     # Path/URL validation
│   │   └── helpers.ts         # Internal helpers
│   ├── ext.ts                 # Extended operations (copy, move, exists, emptyDir)
│   └── tmp.ts                 # Temporary file operations
│
└── sync/                       # Sync API via Worker communication
    ├── mod.ts                 # Aggregates sync modules
    ├── ops.ts                 # Main thread sync operations (*Sync functions)
    ├── protocol.ts            # SharedArrayBuffer communication protocol
    ├── defines.ts             # Sync-specific types
    └── channel/               # SyncChannel namespace
        ├── mod.ts             # Aggregates channel modules
        ├── connect.ts         # Main thread: connect, attach, isReady
        ├── listen.ts          # Worker thread: request handler
        └── state.ts           # Shared channel state
```

#### Key Design Principles

1. **Result-Based Error Handling**: All async operations return `AsyncIOResult<T>` or `AsyncVoidIOResult` from `happy-rusty`
   - Never throws exceptions for I/O errors
   - Always check `.isOk()` / `.isErr()` before unwrapping

2. **Dual API Pattern**: Both async and sync APIs exposed for the same functionality
   - Use async APIs for typical use cases (recommended)
   - Use sync APIs only when synchronous operations are absolutely required

3. **Path Normalization**: All paths processed through `@std/path/posix` before OPFS operations
   - All paths must be absolute (start with `/`)
   - Internal code uses POSIX format throughout

4. **Internal vs Public**: Code marked with `@internal` is not part of stable public API
   - May change between versions without semver bump

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

#### 2. Dual API Pattern
- **Async APIs** (`src/async/`): Direct OPFS operations, recommended for use
- **Sync APIs** (`src/sync/`): Implemented via Worker communication using SharedArrayBuffer
  - Main thread calls sync function → blocks and waits
  - Worker thread executes async OPFS operation
  - Result is passed back via SharedArrayBuffer
  - **Usage:** Use `SyncChannel` namespace:
    - `SyncChannel.listen()` in worker to start listening
    - `SyncChannel.connect(worker, options?)` in main thread to connect
    - `SyncChannel.attach(sharedBuffer, options?)` to share connection between contexts (e.g., iframes)
    - `SyncChannel.isReady()` to check if channel is ready

#### 3. Path Handling
- All paths are normalized to POSIX format using `@std/path/posix`
- Paths must be absolute (start with `/`)
- Root directory: `/`
- Temporary directory: `/tmp`
- Path validation via `validateAbsolutePath()` in `async/internal/validations.ts`

#### 4. URL Parameter Support
Functions accepting URL parameters (`downloadFile`, `uploadFile`, `zipFromUrl`, `unzipFromUrl`) support both:
- `string` - URL as string
- `URL` - URL object

URL validation uses `URL.canParse()` with fallback to `new URL()` for older browsers.

#### 5. Handle-Based File System
- Internal implementation uses FileSystemHandle hierarchy
- Helper functions in `helpers.ts` manage handle retrieval and traversal
- Public API uses path strings, internal code uses handles

#### 6. Worker Communication Protocol
Located in `src/sync/protocol.ts`:
- Uses SharedArrayBuffer with Int32Array for lock-based communication
- Atomics.wait/notify for synchronization
- JSON serialization for data transfer
- `SyncMessenger` class encapsulates buffer operations:
  - `i32a` (public): Int32Array for atomic lock operations
  - `maxDataLength` (public): Maximum payload size
  - `setPayload()` / `getPayload()`: Methods to write/read payload data
  - `HEADER_LENGTH` (private static): Fixed header size (16 bytes)

#### 7. Error Message Conventions
- Error messages start with uppercase (consistent with browser DOMException)
- Error messages do NOT end with periods
- Custom error types use helper functions (e.g., `createNotFoundError()`)

### Important Implementation Details

#### Type Assertions for Uint8Array
When passing Uint8Array data to writeFile operations, explicit type assertions may be needed:
```typescript
await writeFile(path, data as Uint8Array<ArrayBuffer>);
```

#### Error Constants
Common error constants exported from `src/shared/constants.ts`:
- `NOT_FOUND_ERROR` - File/directory not found (DOMException name)
- `EMPTY_BODY_ERROR` - Response body is empty (null), from 204/304 responses or HEAD requests
- `EMPTY_FILE_ERROR` - File content is empty (0 bytes)
- `NOTHING_TO_ZIP_ERROR` - Empty directory with no entries to zip
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

5. **Error Messages:** Error messages should start with uppercase (consistent with browser DOMException) and NOT end with a period

6. **Testing:** Use OPFS Explorer browser extension to visually inspect file system state during development

7. **Test Coverage Limitations:**
   - `src/sync/channel/listen.ts` is excluded from coverage (runs in Worker thread, V8 cannot instrument)
   - `src/async/core/*.ts` has uncovered branches that run in Worker context (tested via sync API)
   - `src/mod.ts` and type definition files (`defines.ts`) are excluded (re-exports and type definitions only)

## Examples

The `examples/` directory contains runnable examples for all major features:

- `basic.ts` - File/directory CRUD operations
- `download-upload.ts` - File download and upload with progress
- `stream.ts` - Readable/writable stream operations
- `zip.ts` - Zip/unzip operations
- `sync-api.ts` + `sync-worker.ts` - Synchronous file operations via Web Worker
- `shared-messenger.ts` + `shared-messenger-child.ts` - Sharing sync channel between iframe contexts

Run examples with `pnpm eg` (requires HTTPS, Vite dev server handles this automatically).
