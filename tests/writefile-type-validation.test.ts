/**
 * Test for writeFile/writeFileSync behavior with invalid content types.
 * Tests runtime behavior when TypeScript type checking is bypassed.
 */
import { describe, expect, it } from 'vitest';
import type { WriteFileContent, WriteSyncFileContent } from '../src/mod.ts';
import * as fs from '../src/mod.ts';

// Invalid content types
const invalidContents = [
    { name: 'number', value: 123 },
    { name: 'object', value: { key: 'value' } },
    { name: 'null', value: null },
    { name: 'undefined', value: undefined },
    { name: 'array', value: [1, 2, 3] },
    { name: 'boolean', value: true },
    { name: 'symbol', value: Symbol('test') },
    { name: 'function', value: () => { } },
];

describe('writeFile with invalid content types', () => {
    for (const { name, value } of invalidContents) {
        it(`should reject ${ name } at runtime`, async () => {
            const result = await fs.writeFile('/test.txt', value as unknown as WriteFileContent);
            expect(result.isErr()).toBe(true);
            const err = result.unwrapErr();
            expect(err).toBeInstanceOf(TypeError);
            expect(err.message).toContain('Invalid content type');
        });
    }
});

describe('writeFileSync with invalid content types', () => {
    // WriteSyncFileContent does not support Blob and ReadableStream
    const syncInvalidContents = [
        ...invalidContents,
        { name: 'Blob', value: new Blob(['test']) },
        { name: 'ReadableStream', value: new ReadableStream() },
    ];

    for (const { name, value } of syncInvalidContents) {
        it(`should reject ${ name } at runtime`, () => {
            const result = fs.writeFileSync('/test.txt', value as unknown as WriteSyncFileContent);
            expect(result.isErr()).toBe(true);
            const err = result.unwrapErr();
            expect(err).toBeInstanceOf(TypeError);
            expect(err.message).toContain('Invalid content type');
        });
    }
});
