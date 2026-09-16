/**
 * POSIX path helpers from JSR's `@std/path`, re-exported for internal use.
 *
 * This module is the single inlining point for `@std/path`: `src/shared/internal/**`
 * is externalized to the `_internal` entry (see `vite.config.ts`), so routing every
 * import through here embeds one copy in the npm build instead of one per entry.
 * `@std/path` is JSR-only, so the manifest keeps it in `devDependencies` for the
 * build to bundle — never move it back to `dependencies`, which would force npm
 * consumers to configure `@jsr:registry=...` in their `.npmrc`.
 *
 * @internal
 * @module
 */
export { SEPARATOR, basename, dirname, extname, join, normalize } from '@std/path/posix';
