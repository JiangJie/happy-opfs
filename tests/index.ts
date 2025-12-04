import * as fs from '../src/mod.ts';
import { testAsync } from './async/index.ts';
import { testSync } from './sync/index.ts';

(async () => {
    console.log('%c🗂️ Happy OPFS Test Suite', 'color: #6366f1; font-weight: bold; font-size: 18px');
    console.log('');

    // Check if OPFS is supported
    if (!fs.isOPFSSupported()) {
        console.error('%c❌ OPFS is not supported in this environment', 'color: #ef4444');
        return;
    }
    console.log('%c✓ OPFS is supported', 'color: #22c55e');
    console.log('');

    // Run async tests
    await testAsync();

    // Run sync tests
    await testSync();

    console.log('%c\n🎉 All tests completed!', 'color: #6366f1; font-weight: bold; font-size: 14px');
})();
