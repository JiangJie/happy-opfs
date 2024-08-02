import { CborDecoderBase } from 'json-joy/esm/json-pack/cbor/CborDecoderBase';
import { CborEncoder } from 'json-joy/esm/json-pack/cbor/CborEncoder';
import { sleepUntil } from './helpers.ts';

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
 * Main thread lock index used in Int32Array.
 */
const MAIN_LOCK_INDEX = 0;

/**
 * Worker thread lock index used in Int32Array.
 */
const WORKER_LOCK_INDEX = 1;

/**
 * Data index used in Int32Array.
 */
const DATA_INDEX = 2;

/**
 * Main thread locked value.
 */
const MAIN_LOCKED = 1;

/**
 * Main thread unlocked value.
 * Default.
 */
const MAIN_UNLOCKED = 0;

/**
 * Worker thread locked value.
 * Default.
 */
const WORKER_LOCKED = MAIN_UNLOCKED;

/**
 * Worker thread unlocked value.
 */
const WORKER_UNLOCKED = MAIN_LOCKED;

/**
 * Inspired by [memfs](https://github.com/streamich/memfs/blob/master/src/fsa-to-node/worker/SyncMessenger.ts).
 *
 * Used both in main thread and worker thread.
 */
export class SyncMessenger {
    // View of SharedArrayBuffer, used to communicate between main thread and worker.
    readonly i32a: Int32Array;
    // View of the same SharedArrayBuffer, used to read and write binary data.
    readonly u8a: Uint8Array;
    // 4 int: MAIN_LOCK_INDEX WORKER_LOCK_INDEX DATA_INDEX NOT_USE
    readonly headerLength = 4 * 4;
    // maximum length of data to be sent. If data is longer than this, it will throw an error.
    readonly maxDataLength: number;

    // Used to encode parameters and return values.
    readonly encoder = new CborEncoder();
    // Used to decode parameters and return values.
    readonly decoder = new CborDecoderBase();

    constructor(sab: SharedArrayBuffer) {
        this.i32a = new Int32Array(sab);
        this.u8a = new Uint8Array(sab);
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
    const { i32a, u8a, headerLength, maxDataLength } = messenger;
    const requestLength = data.byteLength;

    // check whether request is too large
    if (requestLength > maxDataLength) {
        throw new RangeError(`Request is too large: ${ requestLength } > ${ maxDataLength }. Consider grow the size of SharedArrayBuffer.`);
    }

    // lock main thread
    Atomics.store(i32a, MAIN_LOCK_INDEX, MAIN_LOCKED);

    // payload and length
    i32a[DATA_INDEX] = requestLength;
    u8a.set(data, headerLength);

    // wakeup worker
    // Atomics.notify(i32a, WORKER_LOCK_INDEX); // this may not work
    Atomics.store(i32a, WORKER_LOCK_INDEX, WORKER_UNLOCKED);

    // wait for worker to finish
    sleepUntil(() => Atomics.load(i32a, MAIN_LOCK_INDEX) === MAIN_UNLOCKED);

    // worker return
    const responseLength = i32a[DATA_INDEX];
    const response = u8a.slice(headerLength, headerLength + responseLength);

    return response;
}

/**
 * Responds to main thread from worker thread.
 * Used in worker thread.
 * @param messenger - SyncMessenger
 * @param transfer - Function to transfer request data.
 */
export async function respondToMainFromWorker(messenger: SyncMessenger, transfer: (data: Uint8Array) => Promise<Uint8Array>): Promise<void> {
    const { i32a, u8a, headerLength, maxDataLength, encoder } = messenger;

    while (true) {
        if (Atomics.load(i32a, WORKER_LOCK_INDEX) === WORKER_UNLOCKED) {
            break;
        }
    }

    // because of `Atomics.notify` may not work
    // const waitRes = Atomics.wait(i32a, WORKER_LOCK_INDEX, WORKER_LOCKED);
    // if (waitRes !== 'ok') {
    //     throw new Error(`Unexpected Atomics.wait result: ${ waitRes }`);
    // }

    // payload and length
    const requestLength = i32a[DATA_INDEX];
    // console.log(`requestLength: ${ requestLength }`);
    const data = u8a.slice(headerLength, headerLength + requestLength);

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
            // lock worker thread before throw
            Atomics.store(i32a, WORKER_LOCK_INDEX, WORKER_LOCKED);

            throw new RangeError(message);
        }
    }

    // write response data
    i32a[DATA_INDEX] = response.byteLength;
    u8a.set(response, headerLength);

    // lock worker thread
    Atomics.store(i32a, WORKER_LOCK_INDEX, WORKER_LOCKED);

    // wakeup main thread
    Atomics.store(i32a, MAIN_LOCK_INDEX, MAIN_UNLOCKED);
}