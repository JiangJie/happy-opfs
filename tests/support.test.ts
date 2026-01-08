/**
 * Support module tests using Vitest
 * Tests: isOPFSSupported
 */
import { describe, expect, it } from 'vitest';
import { isOPFSSupported } from '../src/mod.ts';

describe('Support', () => {
    describe('isOPFSSupported', () => {
        it('should return boolean', () => {
            const result = isOPFSSupported();
            expect(typeof result).toBe('boolean');
        });

        it('should return true in supported environment', () => {
            // Since tests run in a browser with OPFS support
            expect(isOPFSSupported()).toBe(true);
        });

        it('should be callable multiple times', () => {
            const result1 = isOPFSSupported();
            const result2 = isOPFSSupported();
            const result3 = isOPFSSupported();
            
            expect(result1).toBe(result2);
            expect(result2).toBe(result3);
        });
    });
});
