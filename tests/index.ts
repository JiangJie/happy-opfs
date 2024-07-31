import { testAsync } from './async.ts';
import { testSync } from './sync.ts';

(async () => {
    await testAsync();
    await testSync();
})();