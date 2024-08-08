import * as fs from '../src/mod.ts';
import { testAsync } from './async.ts';
import { testSync } from './sync.ts';

(async () => {
    // Check if OPFS is supported
    console.log(`OPFS is${ fs.isOPFSSupported() ? '' : ' not' } supported`);

    await testAsync();
    await testSync();
})();