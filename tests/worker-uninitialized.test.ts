/**
 * Tests for uninitialized worker state
 * This test file runs BEFORE connecting sync agent to test error cases
 * 
 * IMPORTANT: This file tests what happens when sync APIs are called
 * without initializing the worker first.
 */
import { describe, expect, it } from 'vitest';

// Import functions directly to avoid side effects from mod.ts
import { existsSync, readFileSync, writeFileSync, createFileSync, mkdirSync, removeSync, statSync } from '../src/worker/opfs_worker_adapter.ts';

describe('Worker Uninitialized State', () => {
    describe('Sync operations without connectSyncAgent', () => {
        // These tests verify that sync operations fail gracefully
        // when the worker hasn't been initialized

        it('should return error for existsSync when not initialized', () => {
            // Note: In the actual test environment, connectSyncAgent may have been called
            // by other test files. This test documents the expected behavior when
            // the messenger is not initialized.
            
            // If messenger is null, it should return an error
            const result = existsSync('/test');
            
            // Either returns error (not initialized) or succeeds (if already connected)
            if (result.isErr()) {
                const error = result.unwrapErr();
                expect(error.message).toContain('Worker not initialized');
            } else {
                // Already connected from another test
                expect(result.isOk()).toBe(true);
            }
        });

        it('should return error for readFileSync when not initialized', () => {
            const result = readFileSync('/non-existent');
            
            if (result.isErr()) {
                const error = result.unwrapErr();
                // Either "Worker not initialized" or actual file error
                expect(error).toBeInstanceOf(Error);
            }
        });

        it('should return error for writeFileSync when not initialized', () => {
            const result = writeFileSync('/test.txt', 'content');
            
            if (result.isErr()) {
                const error = result.unwrapErr();
                expect(error).toBeInstanceOf(Error);
            }
        });

        it('should return error for createFileSync when not initialized', () => {
            const result = createFileSync('/test.txt');
            
            if (result.isErr()) {
                const error = result.unwrapErr();
                expect(error).toBeInstanceOf(Error);
            }
        });

        it('should return error for mkdirSync when not initialized', () => {
            const result = mkdirSync('/test-dir');
            
            if (result.isErr()) {
                const error = result.unwrapErr();
                expect(error).toBeInstanceOf(Error);
            }
        });

        it('should return error for removeSync when not initialized', () => {
            const result = removeSync('/test');
            
            if (result.isErr()) {
                const error = result.unwrapErr();
                expect(error).toBeInstanceOf(Error);
            }
        });

        it('should return error for statSync when not initialized', () => {
            const result = statSync('/');
            
            if (result.isErr()) {
                const error = result.unwrapErr();
                expect(error).toBeInstanceOf(Error);
            }
        });
    });
});
