/**
 * Test for emptyDir('/') - covers ext.ts line 71.
 *
 * This test covers ext.ts line 71: emptyDir('/') -> remove('/')
 * 
 * Note: This test uses a simplified approach to avoid OPFS persistence issues.
 */
import { describe, expect, it } from 'vitest';
import * as fs from '../src/mod.ts';

describe('emptyDir root directory', () => {
    it('should call remove for root directory (ext.ts line 71)', async () => {
        // This test verifies that emptyDir('/') correctly delegates to remove('/')
        // by checking the result is Ok regardless of initial state
        
        // First, ensure we have a clean state by calling emptyDir twice
        // The second call should also succeed (idempotent)
        await fs.emptyDir('/');
        
        // Create a test file
        await fs.writeFile('/empty-root-test.txt', 'test');
        
        // Verify file exists
        expect((await fs.exists('/empty-root-test.txt')).unwrap()).toBe(true);
        
        // Call emptyDir('/') - this is the line we're testing (ext.ts:71)
        const result = await fs.emptyDir('/');
        expect(result.isOk()).toBe(true);
        
        // Verify file was removed
        expect((await fs.exists('/empty-root-test.txt')).unwrap()).toBe(false);
    });
});
