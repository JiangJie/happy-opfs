// import { appendFile, exists, isOPFSSupported, mkdir, readDir, readFile, readTextFile, remove, rename, stat, writeFile } from '@happy-js/happy-opfs';
import { appendFile, exists, isOPFSSupported, mkdir, readDir, readFile, readTextFile, remove, rename, stat, writeFile } from '../src/mod.ts';

(async () => {
    // Check if OPFS is supported
    console.log(`OPFS is${ isOPFSSupported() ? '' : ' not' } supported`);

    // Clear all files and folders
    await remove('/');
    // Recursively create the /happy/opfs directory
    await mkdir('/happy/opfs');
    // Create and write file content
    await writeFile('/happy/opfs/a.txt', 'hello opfs');
    // Move the file
    await rename('/happy/opfs/a.txt', '/happy/b.txt');
    // Append content to the file
    await appendFile('/happy/b.txt', ' happy opfs');

    // File no longer exists
    console.assert((await stat('/happy/opfs/a.txt')).isErr());
    console.assert((await readFile('/happy/b.txt')).unwrap().byteLength === 21);
    // Automatically normalize the path
    console.assert((await readTextFile('//happy///b.txt//')).unwrap() === 'hello opfs happy opfs');

    await remove('/happy/opfs');

    console.assert(!(await exists('/happy/opfs')).unwrap());
    console.assert((await exists('/happy/b.txt')).unwrap());

    // List all files and folders in the root directory
    for await (const [name, handle] of (await readDir('/')).unwrap()) {
        console.log(`${ name } is a ${ handle.kind }`); // happy is a directory
    }
})();