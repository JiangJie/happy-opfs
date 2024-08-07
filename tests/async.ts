import * as fs from '..';
import { mockAll, mockSingle, mockZipUrl } from './constants.ts';

export async function testAsync() {
    // Check if OPFS is supported
    console.log(`OPFS is${ fs.isOPFSSupported() ? '' : ' not' } supported`);

    // Clear all files and folders
    await fs.emptyDir(fs.ROOT_DIR);
    // Recursively create the /happy/opfs directory
    await fs.mkdir('/happy/opfs');
    // Create and write file content
    await fs.writeFile('/happy/opfs/a.txt', 'hello opfs');
    await fs.writeFile('/happy/op-fs/fs.txt', 'hello opfs');
    // Move the file
    await fs.rename('/happy/opfs/a.txt', '/happy/b.txt');
    // Append content to the file
    await fs.appendFile('/happy/b.txt', ' happy opfs');

    // File no longer exists
    const statRes = await fs.stat('/happy/opfs/a.txt');
    console.assert(statRes.isErr());

    console.assert((await fs.readFile('/happy/b.txt')).unwrap().byteLength === 21);
    // Automatically normalize the path
    console.assert((await fs.readTextFile('//happy///b.txt//')).unwrap() === 'hello opfs happy opfs');

    console.assert((await fs.remove('/happy/not/exists')).isOk());
    console.assert((await fs.remove('/happy/opfs')).isOk());

    console.assert(!(await fs.exists('/happy/opfs')).unwrap());
    console.assert((await fs.exists('/happy/b.txt')).unwrap());
    console.assert(fs.isFileKind((await fs.stat('/happy/b.txt')).unwrap().kind));

    // Download a file
    const downloadTask = fs.downloadFile(mockSingle, '/todo.json', {
        timeout: 1000,
        onProgress(progressResult): void {
            progressResult.inspect(progress => {
                console.log(`Downloaded ${ progress.completedByteLength }/${ progress.totalByteLength } bytes`);
            });
        },
    });
    const downloadRes = await downloadTask.response;
    if (downloadRes.isOk()) {
        console.assert(downloadRes.unwrap() instanceof Response);

        const postData = (await fs.readTextFile('/todo.json')).unwrap();
        const postJson: {
            id: number;
            title: string;
        } = JSON.parse(postData);
        console.assert(postJson.id === 1);

        // Modify the file
        postJson.title = 'happy-opfs';
        await fs.writeFile('/todo.json', JSON.stringify(postJson));

        // Upload a file
        console.assert((await fs.uploadFile('/todo.json', mockAll).response).unwrap() instanceof Response);
    } else {
        console.assert(downloadRes.unwrapErr() instanceof Error);
    }

    // Will create directory
    await fs.emptyDir('/not-exists');

    // Zip/Unzip
    console.assert((await fs.zip('/happy', '/happy.zip')).isOk());
    console.assert((await fs.zip('/happy')).unwrap().byteLength === (await fs.readFile('/happy.zip')).unwrap().byteLength);
    console.assert((await fs.unzip('/happy.zip', '/happy-2')).isOk());
    console.assert((await fs.unzipFromUrl(mockZipUrl, '/happy-3', {
        onProgress(progressResult) {
            progressResult.inspect(progress => {
                console.log(`Unzipped ${ progress.completedByteLength }/${ progress.totalByteLength } bytes`);
            });
        },
    })).isOk());

    // List all files and folders in the root directory
    for await (const { path, handle } of (await fs.readDir(fs.ROOT_DIR, {
        recursive: true,
    })).unwrap()) {
        const handleLike = await fs.toFileSystemHandleLike(handle);
        if (fs.isFileKind(handleLike.kind)) {
            const file = handleLike as fs.FileSystemFileHandleLike;
            console.log(`${ path } is a ${ handleLike.kind }, name = ${ handleLike.name }, type = ${ file.type }, size = ${ file.size }, lastModified = ${ file.lastModified }`);
        } else {
            console.log(`${ path } is a ${ handleLike.kind }, name = ${ handleLike.name }`);
        }
    }

    // Comment this line to view using OPFS Explorer
    await fs.remove(fs.ROOT_DIR);
}