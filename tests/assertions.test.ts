/**
 * Assertions module tests using Vitest
 * Tests: assertAbsolutePath, assertValidUrl
 */
import { describe, expect, it } from 'vitest';
import { assertAbsolutePath, assertValidUrl } from '../src/async/internal/assertions.ts';

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

        it('should normalize and return canonical paths', () => {
            // Root paths
            expect(assertAbsolutePath('/')).toBe('/');
            expect(assertAbsolutePath('//')).toBe('/');
            expect(assertAbsolutePath('///')).toBe('/');
            expect(assertAbsolutePath('////')).toBe('/');

            // Trailing slashes should be removed (except root)
            expect(assertAbsolutePath('/a/')).toBe('/a');
            expect(assertAbsolutePath('/a/b/')).toBe('/a/b');
            expect(assertAbsolutePath('/a/b/c/')).toBe('/a/b/c');

            // Multiple slashes should be collapsed
            expect(assertAbsolutePath('//a')).toBe('/a');
            expect(assertAbsolutePath('/a//b')).toBe('/a/b');
            expect(assertAbsolutePath('/a///b')).toBe('/a/b');
            expect(assertAbsolutePath('///a//b//c///')).toBe('/a/b/c');

            // Dot segments should be resolved
            expect(assertAbsolutePath('/a/./b')).toBe('/a/b');
            expect(assertAbsolutePath('/a/b/./c')).toBe('/a/b/c');
            expect(assertAbsolutePath('/./a/./b/.')).toBe('/a/b');

            // Parent directory segments should be resolved
            expect(assertAbsolutePath('/a/../b')).toBe('/b');
            expect(assertAbsolutePath('/a/b/../c')).toBe('/a/c');
            expect(assertAbsolutePath('/a/b/c/../../d')).toBe('/a/d');
            expect(assertAbsolutePath('/a/b/../../../c')).toBe('/c');

            // Mixed cases
            expect(assertAbsolutePath('//a/./b/../c//')).toBe('/a/c');
            expect(assertAbsolutePath('///foo//bar///')).toBe('/foo/bar');
            expect(assertAbsolutePath('/a/b/./c/../d/')).toBe('/a/b/d');
        });

        it('should handle edge cases for path normalization', () => {
            // Going above root should stay at root
            expect(assertAbsolutePath('/../')).toBe('/');
            expect(assertAbsolutePath('/../../')).toBe('/');
            expect(assertAbsolutePath('/../a')).toBe('/a');

            // Single segment paths
            expect(assertAbsolutePath('/a')).toBe('/a');
            expect(assertAbsolutePath('/a/')).toBe('/a');
            expect(assertAbsolutePath('//a//')).toBe('/a');

            // Complex nested paths
            expect(assertAbsolutePath('/a/b/c/d/e/../../../f/g')).toBe('/a/b/f/g');
        });
    });

    describe('assertValidUrl', () => {
        it('should return URL for valid http URLs', () => {
            expect(assertValidUrl('http://example.com/file.txt')).toBeInstanceOf(URL);
            expect(assertValidUrl('https://example.com/file.txt')).toBeInstanceOf(URL);
        });

        it('should handle URLs with query strings', () => {
            const url = assertValidUrl('https://example.com/file.txt?v=1');
            expect(url.search).toBe('?v=1');
        });

        it('should handle URLs with hash', () => {
            const url = assertValidUrl('https://example.com/file.txt#section');
            expect(url.hash).toBe('#section');
        });

        it('should return URL objects as-is', () => {
            const url = new URL('https://example.com');
            expect(assertValidUrl(url)).toBe(url);
        });

        it('should handle relative URLs using current location', () => {
            // Relative URLs should be resolved against location.href
            const url = assertValidUrl('./api/data.json');
            expect(url).toBeInstanceOf(URL);
            expect(url.pathname).toContain('api/data.json');
        });

        it('should handle absolute path URLs', () => {
            const url = assertValidUrl('/api/data.json');
            expect(url).toBeInstanceOf(URL);
            expect(url.pathname).toBe('/api/data.json');
        });
    });
});
