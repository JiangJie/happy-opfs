/**
 * Support module tests using Vitest
 * Tests: isOPFSSupported, isSyncChannelSupported
 */
import { describe, expect, it } from 'vitest';
import { isOPFSSupported, isSyncChannelSupported } from '../src/mod.ts';

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

    describe('isSyncChannelSupported', () => {
        it('should return boolean', () => {
            const result = isSyncChannelSupported();
            expect(typeof result).toBe('boolean');
        });

        it('should return true when SharedArrayBuffer and Atomics are available', () => {
            // In cross-origin isolated environments, both should be available
            const hasSharedArrayBuffer = typeof SharedArrayBuffer === 'function';
            const hasAtomics = typeof Atomics === 'object';
            
            expect(isSyncChannelSupported()).toBe(hasSharedArrayBuffer && hasAtomics);
        });

        it('should be callable multiple times with consistent results', () => {
            const result1 = isSyncChannelSupported();
            const result2 = isSyncChannelSupported();
            const result3 = isSyncChannelSupported();
            
            expect(result1).toBe(result2);
            expect(result2).toBe(result3);
        });
    });
});
