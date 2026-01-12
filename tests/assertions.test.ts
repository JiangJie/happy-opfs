/**
 * Assertions module tests using Vitest
 * Tests: validateAbsolutePath, validateUrl
 */
import { describe, expect, it } from 'vitest';
import { validateAbsolutePath, validateUrl } from '../src/async/internal/assertions.ts';

describe('Assertions', () => {
    describe('validateAbsolutePath', () => {
        it('should return Ok for valid absolute paths', () => {
            expect(validateAbsolutePath('/').isOk()).toBe(true);
            expect(validateAbsolutePath('/file.txt').isOk()).toBe(true);
            expect(validateAbsolutePath('/path/to/file').isOk()).toBe(true);
            expect(validateAbsolutePath('/a/b/c/d/e').isOk()).toBe(true);
        });

        it('should return Err for relative paths', () => {
            expect(validateAbsolutePath('file.txt').isErr()).toBe(true);
            expect(validateAbsolutePath('path/to/file').isErr()).toBe(true);
            expect(validateAbsolutePath('./file.txt').isErr()).toBe(true);
            expect(validateAbsolutePath('../file.txt').isErr()).toBe(true);
        });

        it('should return Err for empty string', () => {
            expect(validateAbsolutePath('').isErr()).toBe(true);
        });

        it('should return Err for non-string values', () => {
            // @ts-expect-error Testing invalid input
            expect(validateAbsolutePath(null).isErr()).toBe(true);
            // @ts-expect-error Testing invalid input
            expect(validateAbsolutePath(undefined).isErr()).toBe(true);
            // @ts-expect-error Testing invalid input
            expect(validateAbsolutePath(123).isErr()).toBe(true);
            // @ts-expect-error Testing invalid input
            expect(validateAbsolutePath({}).isErr()).toBe(true);
            // @ts-expect-error Testing invalid input
            expect(validateAbsolutePath([]).isErr()).toBe(true);
        });

        it('should return Ok for paths with special characters', () => {
            expect(validateAbsolutePath('/file with spaces.txt').isOk()).toBe(true);
            expect(validateAbsolutePath('/file-with-dashes.txt').isOk()).toBe(true);
            expect(validateAbsolutePath('/file_with_underscores.txt').isOk()).toBe(true);
            expect(validateAbsolutePath('/file.multiple.dots.txt').isOk()).toBe(true);
            expect(validateAbsolutePath('/中文文件.txt').isOk()).toBe(true);
        });

        it('should normalize and return canonical paths', () => {
            // Root paths
            expect(validateAbsolutePath('/').unwrap()).toBe('/');
            expect(validateAbsolutePath('//').unwrap()).toBe('/');
            expect(validateAbsolutePath('///').unwrap()).toBe('/');
            expect(validateAbsolutePath('////').unwrap()).toBe('/');

            // Trailing slashes should be removed (except root)
            expect(validateAbsolutePath('/a/').unwrap()).toBe('/a');
            expect(validateAbsolutePath('/a/b/').unwrap()).toBe('/a/b');
            expect(validateAbsolutePath('/a/b/c/').unwrap()).toBe('/a/b/c');

            // Multiple slashes should be collapsed
            expect(validateAbsolutePath('//a').unwrap()).toBe('/a');
            expect(validateAbsolutePath('/a//b').unwrap()).toBe('/a/b');
            expect(validateAbsolutePath('/a///b').unwrap()).toBe('/a/b');
            expect(validateAbsolutePath('///a//b//c///').unwrap()).toBe('/a/b/c');

            // Dot segments should be resolved
            expect(validateAbsolutePath('/a/./b').unwrap()).toBe('/a/b');
            expect(validateAbsolutePath('/a/b/./c').unwrap()).toBe('/a/b/c');
            expect(validateAbsolutePath('/./a/./b/.').unwrap()).toBe('/a/b');

            // Parent directory segments should be resolved
            expect(validateAbsolutePath('/a/../b').unwrap()).toBe('/b');
            expect(validateAbsolutePath('/a/b/../c').unwrap()).toBe('/a/c');
            expect(validateAbsolutePath('/a/b/c/../../d').unwrap()).toBe('/a/d');
            expect(validateAbsolutePath('/a/b/../../../c').unwrap()).toBe('/c');

            // Mixed cases
            expect(validateAbsolutePath('//a/./b/../c//').unwrap()).toBe('/a/c');
            expect(validateAbsolutePath('///foo//bar///').unwrap()).toBe('/foo/bar');
            expect(validateAbsolutePath('/a/b/./c/../d/').unwrap()).toBe('/a/b/d');
        });

        it('should handle edge cases for path normalization', () => {
            // Going above root should stay at root
            expect(validateAbsolutePath('/../').unwrap()).toBe('/');
            expect(validateAbsolutePath('/../../').unwrap()).toBe('/');
            expect(validateAbsolutePath('/../a').unwrap()).toBe('/a');

            // Single segment paths
            expect(validateAbsolutePath('/a').unwrap()).toBe('/a');
            expect(validateAbsolutePath('/a/').unwrap()).toBe('/a');
            expect(validateAbsolutePath('//a//').unwrap()).toBe('/a');

            // Complex nested paths
            expect(validateAbsolutePath('/a/b/c/d/e/../../../f/g').unwrap()).toBe('/a/b/f/g');
        });

        it('should return proper error types', () => {
            // Non-string should return TypeError
            // @ts-expect-error Testing invalid input
            const typeErr = validateAbsolutePath(123).unwrapErr();
            expect(typeErr).toBeInstanceOf(TypeError);
            expect(typeErr.message).toContain('string');

            // Relative path should return Error
            const pathErr = validateAbsolutePath('relative/path').unwrapErr();
            expect(pathErr).toBeInstanceOf(Error);
            expect(pathErr.message).toContain('absolute');
        });
    });

    describe('validateUrl', () => {
        it('should return Ok with URL for valid http URLs', () => {
            const httpRes = validateUrl('http://example.com/file.txt');
            expect(httpRes.isOk()).toBe(true);
            expect(httpRes.unwrap()).toBeInstanceOf(URL);

            const httpsRes = validateUrl('https://example.com/file.txt');
            expect(httpsRes.isOk()).toBe(true);
            expect(httpsRes.unwrap()).toBeInstanceOf(URL);
        });

        it('should handle URLs with query strings', () => {
            const res = validateUrl('https://example.com/file.txt?v=1');
            expect(res.isOk()).toBe(true);
            expect(res.unwrap().search).toBe('?v=1');
        });

        it('should handle URLs with hash', () => {
            const res = validateUrl('https://example.com/file.txt#section');
            expect(res.isOk()).toBe(true);
            expect(res.unwrap().hash).toBe('#section');
        });

        it('should return URL objects as-is', () => {
            const url = new URL('https://example.com');
            const res = validateUrl(url);
            expect(res.isOk()).toBe(true);
            expect(res.unwrap()).toBe(url);
        });

        it('should handle relative URLs using current location', () => {
            // Relative URLs should be resolved against location.href
            const res = validateUrl('./api/data.json');
            expect(res.isOk()).toBe(true);
            expect(res.unwrap()).toBeInstanceOf(URL);
            expect(res.unwrap().pathname).toContain('api/data.json');
        });

        it('should handle absolute path URLs', () => {
            const res = validateUrl('/api/data.json');
            expect(res.isOk()).toBe(true);
            expect(res.unwrap()).toBeInstanceOf(URL);
            expect(res.unwrap().pathname).toBe('/api/data.json');
        });
    });
});
