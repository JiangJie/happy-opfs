import { CborDecoderBase } from 'json-joy/esm/json-pack/cbor/CborDecoderBase';
import { CborEncoder } from 'json-joy/esm/json-pack/cbor/CborEncoder';
import { sleepUntil } from './helpers';

/**
 * Async I/O operations called from main thread to worker thread.
 */
export const enum WorkerAsyncOp {
    // core
    mkdir,
    readDir,
    remove,
    rename,
    stat,
    writeFile,
    // ext
    appendFile,
    emptyDir,
    exists,
    readBlobFile,
}

/**
 * Inspired by [memfs](https://github.com/streamich/memfs/blob/master/src/fsa-to-node/worker/SyncMessenger.ts).
 *
 * Used both in main thread and worker thread.
 */
export class SyncMessenger {
    // View of SharedArrayBuffer, used to communicate between main thread and worker.
    readonly int32: Int32Array;
    // View of the same SharedArrayBuffer, used to read and write binary data.
    readonly uint8: Uint8Array;
    // int int int int
    readonly headerLength = 4 * 4;
    // maximum length of data to be sent. If data is longer than this, it will throw an error.
    readonly maxDataLength: number;

    // Used to encode parameters and return values.
    readonly encoder = new CborEncoder();
    // Used to decode parameters and return values.
    readonly decoder = new CborDecoderBase();

    constructor(sab: SharedArrayBuffer) {
        this.int32 = new Int32Array(sab);
        this.uint8 = new Uint8Array(sab);
        this.maxDataLength = sab.byteLength - this.headerLength;
    }
}

/**
 * Calls a function in worker thread from main tread and returns the result.
 * Used in main thread.
 * @param messenger - SyncMessenger
 * @param data - Request buffer which is encoded parameters.
 * @returns - Response buffer which is encoded return value.
 */
export function callWorkerFromMain(messenger: SyncMessenger, data: Uint8Array): Uint8Array {
    const { int32, uint8, headerLength, maxDataLength } = messenger;
    const requestLength = data.byteLength;

    // check whether request is too large
    if (requestLength > maxDataLength) {
        throw new RangeError(`Request is too large: ${ requestLength } > ${ maxDataLength }. Consider grow the size of SharedArrayBuffer.`);
    }

    // condition of waiting at main thread
    int32[1] = 1;

    // payload and length
    int32[2] = requestLength;
    uint8.set(data, headerLength);

    // wakeup worker
    Atomics.notify(int32, 0);

    // main thread waiting
    sleepUntil(() => int32[1] === 0);

    // worker return
    const responseLength = int32[2];
    const response = uint8.slice(headerLength, headerLength + responseLength);

    return response;
}

/**
 * Responds to main thread from worker thread.
 * Used in worker thread.
 * @param messenger - SyncMessenger
 * @param transfer - Function to transfer request data.
 */
export async function respondToMainFromWorker(messenger: SyncMessenger, transfer: (data: Uint8Array) => Promise<Uint8Array>): Promise<void> {
    const { int32, uint8, headerLength, maxDataLength, encoder } = messenger;

    const res = Atomics.wait(int32, 0, 0);
    if (res !== 'ok') {
        throw new Error(`Unexpected Atomics.wait result: ${ res }`);
    }

    // payload and length
    const requestLength = int32[2];
    const data = uint8.slice(headerLength, headerLength + requestLength);

    // call async I/O operation
    let response = await transfer(data);
    const responseLength = response.byteLength;

    // check whether response is too large
    if (responseLength > maxDataLength) {
        const message = `Response is too large: ${ responseLength } > ${ maxDataLength }. Consider grow the size of SharedArrayBuffer.`;

        response = encoder.encode([{
            name: 'RangeError',
            message,
        }]);

        // the error is too large?
        if (response.byteLength > maxDataLength) {
            throw new RangeError(message);
        }
    }

    // write response data
    int32[2] = response.byteLength;
    uint8.set(response, headerLength);

    // wakeup main thread
    int32[1] = 0;
}