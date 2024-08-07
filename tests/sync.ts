import * as fs from '..';

function run() {
    fs.emptyDirSync(fs.ROOT_DIR);
    fs.mkdirSync('/happy/opfs');
    fs.writeFileSync('/happy/opfs/a.txt', 'hello opfs');
    fs.renameSync('/happy/opfs/a.txt', '/happy/b.txt');
    fs.appendFileSync('/happy/b.txt', ' happy opfs');

    const statRes = fs.statSync('/happy/opfs/a.txt');
    console.assert(statRes.isErr());

    console.assert(fs.readFileSync('/happy/b.txt').unwrap().byteLength === 21);
    console.assert(fs.readBlobFileSync('/happy/b.txt').unwrap().size === 21);
    console.assert(fs.readTextFileSync('//happy///b.txt//').unwrap() === 'hello opfs happy opfs');

    console.assert(fs.removeSync('/happy/not/exists').isOk());
    console.assert(fs.removeSync('/happy/opfs').isOk());

    console.assert(!fs.existsSync('/happy/opfs').unwrap());
    console.assert(fs.existsSync('/happy/b.txt').unwrap());
    console.assert(fs.isFileKind(fs.statSync('/happy/b.txt').unwrap().kind));

    fs.emptyDirSync('/not-exists');

    // Zip/Unzip
    console.assert(fs.zipSync('/happy', '/happy.zip').isOk());
    console.assert(fs.unzipSync('/happy.zip', '/happy-2').isOk());

    for (const { path, handle } of fs.readDirSync(fs.ROOT_DIR, {
        recursive: true,
    }).unwrap()) {
        if (fs.isFileKind(handle.kind)) {
            const file = handle as fs.FileSystemFileHandleLike;
            console.log(`${ path } is a ${ handle.kind }, name = ${ handle.name }, type = ${ file.type }, size = ${ file.size }, lastModified = ${ file.lastModified }`);
        } else {
            console.log(`${ path } is a ${ handle.kind }, name = ${ handle.name }`);
        }
    }

    // Comment this line to view using OPFS Explorer
    fs.removeSync(fs.ROOT_DIR);
}

export async function testSync() {
    await fs.connectSyncAgent({
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