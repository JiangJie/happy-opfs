import { appendFileSync, connectSyncAgent, emptyDirSync, existsSync, mkdirSync, readDirSync, readFileSync, readTextFileSync, removeSync, renameSync, statSync, writeFileSync } from '../src/mod.ts';

function run() {
    emptyDirSync('/');
    mkdirSync('/happy/opfs');
    writeFileSync('/happy/opfs/a.txt', 'hello opfs');
    renameSync('/happy/opfs/a.txt', '/happy/b.txt');
    appendFileSync('/happy/b.txt', ' happy opfs');

    const statRes = statSync('/happy/opfs/a.txt');
    console.assert(statRes.isErr());

    console.assert(readFileSync('/happy/b.txt').unwrap().byteLength === 21);
    console.assert(readTextFileSync('//happy///b.txt//').unwrap() === 'hello opfs happy opfs');

    console.assert(removeSync('/happy/not/exists').unwrap());
    removeSync('/happy/opfs');

    console.assert(!existsSync('/happy/opfs').unwrap());
    console.assert(existsSync('/happy/b.txt').unwrap());

    emptyDirSync('/not-exists');

    for (const { path, handle } of readDirSync('/', {
        recursive: true,
    }).unwrap()) {
        /**
         * not-exists is a directory
         * happy is a directory
         * happy/b.txt is a file
         */
        console.log(`${ path } is a ${ handle.kind }`);
    }

    // Comment this line to view using OPFS Explorer
    removeSync('/');
}

export async function testSync() {
    await connectSyncAgent({
        worker: new Worker(new URL('worker.ts', import.meta.url), {
            type: 'module'
        }),
        // SharedArrayBuffer size between main thread and worker
        bufferLength: 10 * 1024 * 1024,
        // max wait time at main thread per operation
        opTimeout: 3000,
    });

    for (let index = 0; index < 1; index++) {
        run();
    }
}