import { appendFileSync, downloadFile, emptyDirSync, existsSync, mkdirSync, readDirSync, readFileSync, readTextFileSync, removeSync, renameSync, startMainMessenger, statSync, uploadFile, writeFileSync } from '../src/mod';
import { mockTodo1, mockTodos } from './constants';

export async function testSync() {
    await startMainMessenger({
        worker: new Worker(new URL('worker.ts', import.meta.url), {
            type: 'module'
        }),
    });

    // Clear all files and folders
    emptyDirSync('/');
    // Recursively create the /happy/opfs directory
    mkdirSync('/happy/opfs');
    // Create and write file content
    writeFileSync('/happy/opfs/a.txt', 'hello opfs');
    // Move the file
    renameSync('/happy/opfs/a.txt', '/happy/b.txt');
    // Append content to the file
    appendFileSync('/happy/b.txt', ' happy opfs');

    // File no longer exists
    const statRes = statSync('/happy/opfs/a.txt');
    console.assert(statRes.isErr());

    console.assert(readFileSync('/happy/b.txt').unwrap().byteLength === 21);
    // Automatically normalize the path
    console.assert(readTextFileSync('//happy///b.txt//').unwrap() === 'hello opfs happy opfs');

    console.assert(removeSync('/happy/not/exists').unwrap());
    removeSync('/happy/opfs');

    console.assert(!existsSync('/happy/opfs').unwrap());
    console.assert(existsSync('/happy/b.txt').unwrap());

    // Download a file
    const downloadTask = downloadFile(mockTodo1, '/todo.json', {
        timeout: 1000,
    });
    const downloadRes = await downloadTask.response;
    if (downloadRes.isOk()) {
        console.assert(downloadRes.unwrap() instanceof Response);

        const postData = readTextFileSync('/todo.json').unwrap();
        const postJson: {
            id: number;
            title: string;
        } = JSON.parse(postData);
        console.assert(postJson.id === 1);

        // Modify the file
        postJson.title = 'happy-opfs';
        writeFileSync('/todo.json', JSON.stringify(postJson));

        // Upload a file
        console.assert((await uploadFile('/todo.json', mockTodos).response).unwrap() instanceof Response);
    } else {
        console.assert(downloadRes.unwrapErr() instanceof Error);
    }

    // Will create directory
    emptyDirSync('/not-exists');

    // List all files and folders in the root directory
    for (const { path, handle } of readDirSync('/', {
        recursive: true,
    }).unwrap()) {
        /**
         * todo.json is a file
         * not-exists is a directory
         * happy is a directory
         * happy/b.txt is a file
         */
        console.log(`${ path } is a ${ handle.kind }`);
    }

    // Comment this line to view using OPFS Explorer
    removeSync('/');
}