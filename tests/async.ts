import * as fs from '../src/mod.ts';
import { mockAll, mockSingle, mockZipUrl } from './constants.ts';

export async function testAsync() {
    console.log('start async test');

    // Clear all files and folders
    await fs.emptyDir(fs.ROOT_DIR);
    // Recursively create the /happy/opfs directory
    await fs.mkdir('/happy/opfs');
    // Create and write file content
    await fs.writeFile('/happy/opfs/a.txt', 'hello opfs');
    await fs.writeFile('/happy/op-fs/fs.txt', 'hello opfs');
    // Move the file
    await fs.move('/happy/opfs/a.txt', '/happy/b.txt');
    // Append content to the file
    await fs.appendFile('/happy/b.txt', new TextEncoder().encode(' happy opfs'));

    // File no longer exists
    const statRes = await fs.stat('/happy/opfs/a.txt');
    console.assert(statRes.isErr());

    console.assert((await fs.readFile('/happy/b.txt')).unwrap().byteLength === 21);
    // Automatically normalize the path
    console.assert((await fs.readTextFile('//happy///b.txt//')).unwrap() === 'hello opfs happy opfs');

    console.assert((await fs.remove('/happy/not/exists')).isOk());
    console.assert((await fs.remove('/happy/opfs/exists')).isOk());
    console.assert((await fs.remove('/happy/opfs')).isOk());

    console.assert(!(await fs.exists('/happy/opfs')).unwrap());
    console.assert((await fs.exists('/happy/b.txt')).unwrap());
    console.assert(fs.isFileHandle((await fs.stat('/happy/b.txt')).unwrap()));

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

    {
        // Download a file to a temporary file
        const downloadTask = fs.downloadFile(mockSingle);
        const downloadRes = await downloadTask.response;
        downloadRes.inspect(x => {
            console.assert(fs.isTempPath(x.tempFilePath));
            console.assert(x.rawResponse instanceof Response);
        });
        if (downloadRes.isOk()) {
            await fs.remove(downloadRes.unwrap().tempFilePath);
        }
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
    console.assert((await fs.zipFromUrl(mockZipUrl, '/test-zip.zip')).isOk());
    console.assert((await fs.zipFromUrl(mockZipUrl)).unwrap().byteLength === (await fs.readFile('/test-zip.zip')).unwrap().byteLength);

    // Temp
    console.log(`temp txt file: ${ fs.generateTempPath({
        basename: 'opfs',
        extname: '.txt',
    }) }`);
    console.log(`temp dir: ${ fs.generateTempPath({
        isDirectory: true,
    }) }`);
    (await fs.mkTemp()).inspect(path => {
        console.assert(path.startsWith('/tmp/tmp-'));
    });
    const expired = new Date();
    (await fs.mkTemp({
        basename: 'opfs',
        extname: '.txt',
    })).inspect(path => {
        console.assert(path.startsWith('/tmp/opfs-'));
        console.assert(path.endsWith('.txt'));
    });
    (await fs.mkTemp({
        isDirectory: true,
        basename: '',
    })).inspect(path => {
        console.assert(path.startsWith('/tmp/'));
    });
    console.assert((await Array.fromAsync((await fs.readDir(fs.TMP_DIR)).unwrap())).length === 3);
    await fs.pruneTemp(expired);
    console.assert((await Array.fromAsync((await fs.readDir(fs.TMP_DIR)).unwrap())).length <= 2);
    await fs.deleteTemp();
    console.assert(!(await fs.exists(fs.TMP_DIR)).unwrap());

    // Copy
    await fs.mkdir('/happy/copy');
    console.assert((await fs.copy('/happy/b.txt', '/happy-2')).isErr());
    console.assert((await fs.copy('/happy', '/happy-copy')).isOk());
    await fs.appendFile('/happy-copy/b.txt', ' copy');
    console.assert((await fs.readFile('/happy-copy/b.txt')).unwrap().byteLength === 26);
    await fs.appendFile('/happy/op-fs/fs.txt', ' copy');
    await fs.copy('/happy', '/happy-copy', {
        overwrite: false,
    });
    console.assert((await fs.readFile('/happy-copy/b.txt')).unwrap().byteLength === 26);

    // List all files and folders in the root directory
    for await (const { path, handle } of (await fs.readDir(fs.ROOT_DIR, {
        recursive: true,
    })).unwrap()) {
        const handleLike = await fs.toFileSystemHandleLike(handle);
        if (fs.isFileHandleLike(handleLike)) {
            console.log(`${ path } is a ${ handleLike.kind }, name = ${ handleLike.name }, type = ${ handleLike.type }, size = ${ handleLike.size }, lastModified = ${ handleLike.lastModified }`);
        } else {
            console.log(`${ path } is a ${ handleLike.kind }, name = ${ handleLike.name }`);
        }
    }

    // Comment this line to view using OPFS Explorer
    await fs.remove(fs.ROOT_DIR);
}