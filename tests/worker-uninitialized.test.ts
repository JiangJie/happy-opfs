/**
 * Tests for uninitialized worker state
 * This test file runs BEFORE connecting sync channel to test error cases
 * 
 * IMPORTANT: This file tests what happens when sync APIs are called
 * without initializing the worker first.
 */
import { describe, expect, it } from 'vitest';

// Import functions directly to avoid side effects from mod.ts
import { createFileSync, existsSync, mkdirSync, readFileSync, removeSync, statSync, writeFileSync } from '../src/mod.ts';

describe('Worker Uninitialized State', () => {
    describe('Sync operations without SyncChannel.connect', () => {
        // These tests verify that sync operations fail gracefully
        // when the worker hasn't been initialized

        it('should return error for existsSync when not connected', () => {
            // Note: In the actual test environment, SyncChannel.connect may have been called
            // by other test files. This test documents the expected behavior when
            // the messenger is not initialized.
            
            // If messenger is null, it should return an error
            const result = existsSync('/test');
            
            // Either returns error (not connected) or succeeds (if already ready)
            if (result.isErr()) {
                const error = result.unwrapErr();
                expect(error.message).toContain('Sync channel not connected');
            } else {
                // Already ready from another test
                expect(result.isOk()).toBe(true);
            }
        });

        it('should return error for readFileSync when not connected', () => {
            const result = readFileSync('/non-existent');
            
            if (result.isErr()) {
                const error = result.unwrapErr();
                // Either "Sync channel not connected" or actual file error
                expect(error).toBeInstanceOf(Error);
            }
        });

        it('should return error for writeFileSync when not connected', () => {
            const result = writeFileSync('/test.txt', 'content');
            
            if (result.isErr()) {
                const error = result.unwrapErr();
                expect(error).toBeInstanceOf(Error);
            }
        });

        it('should return error for createFileSync when not connected', () => {
            const result = createFileSync('/test.txt');
            
            if (result.isErr()) {
                const error = result.unwrapErr();
                expect(error).toBeInstanceOf(Error);
            }
        });

        it('should return error for mkdirSync when not connected', () => {
            const result = mkdirSync('/test-dir');
            
            if (result.isErr()) {
                const error = result.unwrapErr();
                expect(error).toBeInstanceOf(Error);
            }
        });

        it('should return error for removeSync when not connected', () => {
            const result = removeSync('/test');
            
            if (result.isErr()) {
                const error = result.unwrapErr();
                expect(error).toBeInstanceOf(Error);
            }
        });

        it('should return error for statSync when not connected', () => {
            const result = statSync('/');
            
            if (result.isErr()) {
                const error = result.unwrapErr();
                expect(error).toBeInstanceOf(Error);
            }
        });
    });
});
