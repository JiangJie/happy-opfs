/**
 * Test for emptyDir('/') - covers the root directory special case in ext.ts.
 * When emptyDir is called with root path, it delegates to remove('/').
 */
import { describe, expect, it } from 'vitest';
import * as fs from '../src/mod.ts';

describe('emptyDir root directory', () => {
    it('should call remove for root directory', async () => {
        // This test verifies that emptyDir('/') correctly delegates to remove('/')
        // by checking the result is Ok regardless of initial state
        
        // First, ensure we have a clean state by calling emptyDir twice
        // The second call should also succeed (idempotent)
        await fs.emptyDir('/');
        
        // Create a test file
        await fs.writeFile('/empty-root-test.txt', 'test');
        
        // Verify file exists
        expect((await fs.exists('/empty-root-test.txt')).unwrap()).toBe(true);
        
        // Call emptyDir('/') - this delegates to remove('/')
        const result = await fs.emptyDir('/');
        expect(result.isOk()).toBe(true);
        
        // Verify file was removed
        expect((await fs.exists('/empty-root-test.txt')).unwrap()).toBe(false);
    });
});
