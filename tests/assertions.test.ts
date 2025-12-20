/**
 * Assertions module tests using Vitest
 * Tests: assertAbsolutePath, assertFileUrl
 */
import { describe, expect, it } from 'vitest';
import { assertAbsolutePath, assertFileUrl } from '../src/fs/assertions.ts';

describe('Assertions', () => {
    describe('assertAbsolutePath', () => {
        it('should pass for valid absolute paths', () => {
            expect(() => assertAbsolutePath('/')).not.toThrow();
            expect(() => assertAbsolutePath('/file.txt')).not.toThrow();
            expect(() => assertAbsolutePath('/path/to/file')).not.toThrow();
            expect(() => assertAbsolutePath('/a/b/c/d/e')).not.toThrow();
        });

        it('should throw for relative paths', () => {
            expect(() => assertAbsolutePath('file.txt')).toThrow();
            expect(() => assertAbsolutePath('path/to/file')).toThrow();
            expect(() => assertAbsolutePath('./file.txt')).toThrow();
            expect(() => assertAbsolutePath('../file.txt')).toThrow();
        });

        it('should throw for empty string', () => {
            expect(() => assertAbsolutePath('')).toThrow();
        });

        it('should throw for non-string values', () => {
            // @ts-expect-error Testing invalid input
            expect(() => assertAbsolutePath(null)).toThrow();
            // @ts-expect-error Testing invalid input
            expect(() => assertAbsolutePath(undefined)).toThrow();
            // @ts-expect-error Testing invalid input
            expect(() => assertAbsolutePath(123)).toThrow();
            // @ts-expect-error Testing invalid input
            expect(() => assertAbsolutePath({})).toThrow();
            // @ts-expect-error Testing invalid input
            expect(() => assertAbsolutePath([])).toThrow();
        });

        it('should pass for paths with special characters', () => {
            expect(() => assertAbsolutePath('/file with spaces.txt')).not.toThrow();
            expect(() => assertAbsolutePath('/file-with-dashes.txt')).not.toThrow();
            expect(() => assertAbsolutePath('/file_with_underscores.txt')).not.toThrow();
            expect(() => assertAbsolutePath('/file.multiple.dots.txt')).not.toThrow();
            expect(() => assertAbsolutePath('/中文文件.txt')).not.toThrow();
        });
    });

    describe('assertFileUrl', () => {
        it('should pass for valid http URLs', () => {
            expect(() => assertFileUrl('http://example.com/file.txt')).not.toThrow();
            expect(() => assertFileUrl('https://example.com/file.txt')).not.toThrow();
        });

        it('should pass for URLs with query strings', () => {
            expect(() => assertFileUrl('https://example.com/file.txt?v=1')).not.toThrow();
            expect(() => assertFileUrl('https://example.com/file?a=1&b=2')).not.toThrow();
        });

        it('should pass for URLs with hash', () => {
            expect(() => assertFileUrl('https://example.com/file.txt#section')).not.toThrow();
        });

        it('should throw for non-string values', () => {
            // @ts-expect-error Testing invalid input
            expect(() => assertFileUrl(null)).toThrow();
            // @ts-expect-error Testing invalid input
            expect(() => assertFileUrl(undefined)).toThrow();
            // @ts-expect-error Testing invalid input
            expect(() => assertFileUrl(123)).toThrow();
            // @ts-expect-error Testing invalid input
            expect(() => assertFileUrl({})).toThrow();
        });

        it('should throw for invalid URL format', () => {
            // assertFileUrl now validates URL format
            expect(() => assertFileUrl('any-string')).toThrow();
            expect(() => assertFileUrl('')).toThrow();
            expect(() => assertFileUrl('/relative/path')).toThrow();
        });

        it('should pass for URL objects', () => {
            expect(() => assertFileUrl(new URL('https://example.com'))).not.toThrow();
        });

        it('should work when URL.canParse is not available (fallback)', () => {
            // Save original URL.canParse
            const originalCanParse = URL.canParse;

            try {
                // Remove URL.canParse to simulate older browsers
                // @ts-expect-error Simulating older browser
                delete URL.canParse;

                // Valid URLs should still pass
                expect(() => assertFileUrl('https://example.com/file.txt')).not.toThrow();
                expect(() => assertFileUrl('http://localhost:8080/path')).not.toThrow();

                // Invalid URLs should still throw
                expect(() => assertFileUrl('not-a-url')).toThrow();
                expect(() => assertFileUrl('')).toThrow();
            } finally {
                // Restore URL.canParse
                URL.canParse = originalCanParse;
            }
        });
    });
});
