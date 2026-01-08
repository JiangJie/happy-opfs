/**
 * Constants module tests using Vitest
 * Tests: ROOT_DIR, TMP_DIR, NOT_FOUND_ERROR, ABORT_ERROR, TIMEOUT_ERROR
 */
import { describe, expect, it } from 'vitest';
import { ABORT_ERROR, NOT_FOUND_ERROR, ROOT_DIR, TIMEOUT_ERROR, TMP_DIR } from '../src/mod.ts';

describe('Constants', () => {
    describe('ROOT_DIR', () => {
        it('should be "/"', () => {
            expect(ROOT_DIR).toBe('/');
        });
    });

    describe('TMP_DIR', () => {
        it('should be "/tmp"', () => {
            expect(TMP_DIR).toBe('/tmp');
        });

        it('should start with ROOT_DIR', () => {
            expect(TMP_DIR.startsWith(ROOT_DIR)).toBe(true);
        });
    });

    describe('NOT_FOUND_ERROR', () => {
        it('should be "NotFoundError"', () => {
            expect(NOT_FOUND_ERROR).toBe('NotFoundError');
        });
    });

    describe('ABORT_ERROR', () => {
        it('should be defined', () => {
            expect(ABORT_ERROR).toBeDefined();
            expect(typeof ABORT_ERROR).toBe('string');
        });
    });

    describe('TIMEOUT_ERROR', () => {
        it('should be defined', () => {
            expect(TIMEOUT_ERROR).toBeDefined();
            expect(typeof TIMEOUT_ERROR).toBe('string');
        });
    });
});
