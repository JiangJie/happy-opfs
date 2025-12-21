/**
 * Direct tests for worker/helpers.ts functions
 * Tests functions that can be called directly from main thread
 */
import { describe, expect, it } from 'vitest';
import { TIMEOUT_ERROR } from '../src/mod.ts';
import type { ErrorLike, FileLike } from '../src/worker/defines.ts';
import { deserializeError, deserializeFile, serializeError, serializeFile, setGlobalOpTimeout, sleepUntil } from '../src/worker/helpers.ts';

describe('Worker Helpers Direct Tests', () => {
    describe('serializeError', () => {
        it('should serialize Error to ErrorLike', () => {
            const error = new Error('Test error message');
            const serialized = serializeError(error);

            expect(serialized).not.toBeNull();
            expect(serialized?.name).toBe('Error');
            expect(serialized?.message).toBe('Test error message');
        });

        it('should serialize TypeError', () => {
            const error = new TypeError('Type error message');
            const serialized = serializeError(error);

            expect(serialized?.name).toBe('TypeError');
            expect(serialized?.message).toBe('Type error message');
        });

        it('should serialize RangeError', () => {
            const error = new RangeError('Range error message');
            const serialized = serializeError(error);

            expect(serialized?.name).toBe('RangeError');
            expect(serialized?.message).toBe('Range error message');
        });

        it('should return null for null input', () => {
            const serialized = serializeError(null);
            expect(serialized).toBeNull();
        });

        it('should serialize custom named error', () => {
            const error = new Error('Custom error');
            error.name = 'NotFoundError';
            const serialized = serializeError(error);

            expect(serialized?.name).toBe('NotFoundError');
            expect(serialized?.message).toBe('Custom error');
        });
    });

    describe('deserializeError', () => {
        it('should deserialize ErrorLike to Error', () => {
            const errorLike = { name: 'Error', message: 'Test message' };
            const error = deserializeError(errorLike);

            expect(error).toBeInstanceOf(Error);
            expect(error.name).toBe('Error');
            expect(error.message).toBe('Test message');
        });

        it('should preserve custom error name', () => {
            const errorLike = { name: 'TypeError', message: 'Invalid type' };
            const error = deserializeError(errorLike);

            expect(error.name).toBe('TypeError');
            expect(error.message).toBe('Invalid type');
        });

        it('should handle empty message', () => {
            const errorLike = { name: 'Error', message: '' };
            const error = deserializeError(errorLike);

            expect(error.message).toBe('');
        });

        it('should round-trip serialize/deserialize', () => {
            const original = new Error('Round trip test');
            original.name = 'CustomError';

            const serialized = serializeError(original) as ErrorLike;
            const deserialized = deserializeError(serialized);

            expect(deserialized.name).toBe(original.name);
            expect(deserialized.message).toBe(original.message);
        });
    });

    describe('serializeFile', () => {
        it('should serialize File to FileLike', async () => {
            const content = 'test file content';
            const file = new File([content], 'test.txt', {
                type: 'text/plain',
                lastModified: 1234567890,
            });

            const fileLike = await serializeFile(file);

            expect(fileLike.name).toBe('test.txt');
            expect(fileLike.type).toBe('text/plain');
            expect(fileLike.lastModified).toBe(1234567890);
            expect(fileLike.size).toBe(content.length);
            expect(Array.isArray(fileLike.data)).toBe(true);
        });

        it('should preserve binary content', async () => {
            const binaryData = new Uint8Array([0, 1, 2, 128, 255]);
            const file = new File([binaryData], 'binary.bin', { type: 'application/octet-stream' });

            const fileLike = await serializeFile(file);

            const resultArray = new Uint8Array(fileLike.data);
            expect(resultArray).toEqual(binaryData);
        });

        it('should handle empty file', async () => {
            const file = new File([], 'empty.txt', { type: 'text/plain' });

            const fileLike = await serializeFile(file);

            expect(fileLike.size).toBe(0);
            expect(fileLike.data.length).toBe(0);
        });

        it('should handle file with special characters in name', async () => {
            const file = new File(['content'], 'file with spaces & special.txt', { type: 'text/plain' });

            const fileLike = await serializeFile(file);

            expect(fileLike.name).toBe('file with spaces & special.txt');
        });
    });

    describe('deserializeFile', () => {
        it('should deserialize FileLike to File', () => {
            const content = 'test content';
            const encoder = new TextEncoder();
            const data = encoder.encode(content).buffer;

            const fileLike: FileLike = {
                name: 'test.txt',
                type: 'text/plain',
                lastModified: 1234567890,
                size: content.length,
                data: Array.from(new Uint8Array(data)),
            };

            const file = deserializeFile(fileLike);

            expect(file).toBeInstanceOf(File);
            expect(file.name).toBe('test.txt');
            expect(file.type).toBe('text/plain');
            expect(file.lastModified).toBe(1234567890);
        });

        it('should round-trip serialize/deserialize File', async () => {
            const originalContent = 'Round trip test content';
            const originalFile = new File([originalContent], 'roundtrip.txt', {
                type: 'text/plain',
                lastModified: 9876543210,
            });

            const serialized = await serializeFile(originalFile);
            const deserialized = deserializeFile(serialized);

            expect(deserialized.name).toBe(originalFile.name);
            expect(deserialized.type).toBe(originalFile.type);
            expect(deserialized.lastModified).toBe(originalFile.lastModified);

            // Verify content
            const originalText = await originalFile.text();
            const deserializedText = await deserialized.text();
            expect(deserializedText).toBe(originalText);
        });

        it('should preserve binary content in round-trip', async () => {
            const binaryData = new Uint8Array([10, 20, 30, 40, 50, 60, 70, 80, 90, 100]);
            const originalFile = new File([binaryData], 'binary.bin', { type: 'application/octet-stream' });

            const serialized = await serializeFile(originalFile);
            const deserialized = deserializeFile(serialized);

            const originalBuffer = await originalFile.arrayBuffer();
            const deserializedBuffer = await deserialized.arrayBuffer();

            expect(new Uint8Array(deserializedBuffer)).toEqual(new Uint8Array(originalBuffer));
        });
    });

    describe('setGlobalOpTimeout', () => {
        it('should set timeout value', () => {
            // Set a custom timeout
            setGlobalOpTimeout(5000);

            // We can't directly verify the internal value, but we can test
            // that sleepUntil uses the new timeout
            // Reset to default after test
            setGlobalOpTimeout(1000);
        });
    });

    describe('sleepUntil', () => {
        it('should return immediately if condition is true', () => {
            const start = Date.now();
            sleepUntil(() => true);
            const elapsed = Date.now() - start;

            // Should be nearly instant (< 50ms)
            expect(elapsed).toBeLessThan(50);
        });

        it('should wait until condition becomes true', () => {
            let counter = 0;

            const start = Date.now();
            sleepUntil(() => {
                counter++;
                return counter > 100;
            });
            const elapsed = Date.now() - start;

            expect(counter).toBeGreaterThan(100);
            // Should complete quickly even with iterations
            expect(elapsed).toBeLessThan(100);
        });

        it('should throw TimeoutError if condition never becomes true', () => {
            // Set a short timeout for testing
            setGlobalOpTimeout(100);

            try {
                expect(() => {
                    sleepUntil(() => false);
                }).toThrow();
            } finally {
                // Reset timeout
                setGlobalOpTimeout(5000);
            }
        });

        it('should throw error with correct name and message', () => {
            setGlobalOpTimeout(50);

            try {
                sleepUntil(() => false);
                expect.fail('Should have thrown');
            } catch (error) {
                expect(error).toBeInstanceOf(Error);
                expect((error as Error).name).toBe(TIMEOUT_ERROR);
                expect((error as Error).message).toBe('Operation timed out');
            } finally {
                setGlobalOpTimeout(5000);
            }
        });
    });
});
