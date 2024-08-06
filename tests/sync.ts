import { appendFileSync, connectSyncAgent, emptyDirSync, existsSync, mkdirSync, readBlobFileSync, readDirSync, readFileSync, readTextFileSync, removeSync, renameSync, ROOT_DIR, statSync, unzipSync, writeFileSync, zipSync, type FileSystemFileHandleLike } from '../src/mod.ts';

function run() {
    emptyDirSync(ROOT_DIR);
    mkdirSync('/happy/opfs');
    writeFileSync('/happy/opfs/a.txt', 'hello opfs');
    renameSync('/happy/opfs/a.txt', '/happy/b.txt');
    appendFileSync('/happy/b.txt', ' happy opfs');

    const statRes = statSync('/happy/opfs/a.txt');
    console.assert(statRes.isErr());

    console.assert(readFileSync('/happy/b.txt').unwrap().byteLength === 21);
    console.assert(readBlobFileSync('/happy/b.txt').unwrap().size === 21);
    console.assert(readTextFileSync('//happy///b.txt//').unwrap() === 'hello opfs happy opfs');

    console.assert(removeSync('/happy/not/exists').isOk());
    removeSync('/happy/opfs');

    console.assert(!existsSync('/happy/opfs').unwrap());
    console.assert(existsSync('/happy/b.txt').unwrap());
    console.assert(statSync('/happy/b.txt').unwrap().kind === 'file');

    emptyDirSync('/not-exists');

    // Zip/Unzip
    console.assert(zipSync('/happy', '/happy.zip').isOk());
    console.assert(unzipSync('/happy.zip', '/happy-2').isOk());

    for (const { path, handle } of readDirSync(ROOT_DIR, {
        recursive: true,
    }).unwrap()) {
        if (handle.kind === 'file') {
            const file = handle as FileSystemFileHandleLike;
            console.log(`${ path } is a ${ handle.kind }, name = ${ handle.name }, type = ${ file.type }, size = ${ file.size }, lastModified = ${ file.lastModified }`);
        } else {
            console.log(`${ path } is a ${ handle.kind }, name = ${ handle.name }`);
        }
    }

    // Comment this line to view using OPFS Explorer
    removeSync(ROOT_DIR);
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